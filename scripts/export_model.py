#!/usr/bin/env python3
"""Export LightGBM classifier from model.pkl to compact JSON for browser inference."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

import joblib
import numpy as np


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = ROOT / "model.pkl"
DEFAULT_OUTPUT_PATH = ROOT / "docs" / "model.json"

MISSING_TYPE_CODE = {
    "None": 0,
    "Zero": 1,
    "NaN": 2,
}


def serialize_tree(tree_structure: dict) -> dict:
    """Convert a nested LightGBM tree dict into compact parallel arrays."""
    if "leaf_value" in tree_structure:
        return {"f": [], "t": [], "l": [], "r": [], "v": [float(tree_structure["leaf_value"])]}

    split_features: list[int] = []
    thresholds: list[float] = []
    left_children: list[int] = []
    right_children: list[int] = []
    missing_codes: list[int] = []
    default_lefts: list[int] = []
    leaf_values: list[float] = []

    def visit(node: dict) -> int:
        if "leaf_value" in node:
            leaf_idx = len(leaf_values)
            leaf_values.append(float(node["leaf_value"]))
            return -1 - leaf_idx

        decision_type = node.get("decision_type", "<=")
        if decision_type != "<=":
            raise ValueError(f"Unsupported LightGBM decision_type: {decision_type!r} (categorical splits are not supported)")

        missing_type = node.get("missing_type", "None")
        if missing_type not in MISSING_TYPE_CODE:
            raise ValueError(f"Unsupported LightGBM missing_type: {missing_type!r}")

        node_idx = len(split_features)
        split_features.append(int(node["split_feature"]))
        thresholds.append(float(node["threshold"]))
        left_children.append(0)
        right_children.append(0)
        missing_codes.append(MISSING_TYPE_CODE[missing_type])
        default_lefts.append(1 if node.get("default_left", True) else 0)

        left_children[node_idx] = visit(node["left_child"])
        right_children[node_idx] = visit(node["right_child"])
        return node_idx

    visit(tree_structure)

    tree_obj: dict = {
        "f": split_features,
        "t": thresholds,
        "l": left_children,
        "r": right_children,
        "v": leaf_values,
    }
    if any(code != 0 for code in missing_codes):
        tree_obj["m"] = missing_codes
        tree_obj["d"] = default_lefts
    return tree_obj


def eval_serialized_tree(tree: dict, row: np.ndarray) -> float:
    """Reference evaluator matching docs/app.js."""
    features = tree["f"]
    if not features:
        return tree["v"][0]

    thresholds = tree["t"]
    left = tree["l"]
    right = tree["r"]
    leaves = tree["v"]
    missing = tree.get("m")
    default_left = tree.get("d")

    idx = 0
    while idx >= 0:
        val = row[features[idx]]
        m_code = missing[idx] if missing is not None else 0
        is_nan = bool(np.isnan(val))

        if m_code == 2 and is_nan:
            go_left = bool(default_left[idx])
        elif m_code == 1 and (is_nan or val == 0.0):
            go_left = bool(default_left[idx])
        else:
            fval = 0.0 if is_nan else val
            go_left = fval <= thresholds[idx]

        idx = left[idx] if go_left else right[idx]

    return leaves[-1 - idx]


def verify_export(model, payload: dict) -> float:
    """Verify exact numerical agreement between exported JSON and LightGBM."""
    import warnings

    rng = np.random.default_rng(20261118)
    n_features = len(payload["feature_names"])
    num_class = payload["num_class"]
    average_output = payload["average_output"]
    trees = payload["trees"]
    n_iter = len(trees) // num_class

    samples = rng.uniform(-5.0, 250.0, size=(300, n_features))
    nan_mask = rng.random(samples.shape) < 0.15
    samples[nan_mask] = np.nan
    samples[0, :] = 0.0
    samples[1, :] = np.nan
    samples[2, :] = -1.0

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        expected_raw = model.predict(samples, raw_score=True)
        expected_proba = model.predict_proba(samples)
        expected_cls = model.predict(samples)

    actual_raw = np.zeros_like(expected_raw, dtype=np.float64)
    for ti, tree in enumerate(trees):
        cls_idx = ti % num_class
        for ri in range(len(samples)):
            actual_raw[ri, cls_idx] += eval_serialized_tree(tree, samples[ri])

    if average_output and n_iter > 0:
        actual_raw /= n_iter

    shifted = actual_raw - np.max(actual_raw, axis=1, keepdims=True)
    exp_scores = np.exp(shifted)
    actual_proba = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    classes = np.asarray(payload["classes"])
    actual_cls = classes[np.argmax(actual_proba, axis=1)]

    max_raw_diff = float(np.max(np.abs(expected_raw - actual_raw)))
    max_proba_diff = float(np.max(np.abs(expected_proba - actual_proba)))
    if max_raw_diff > 1e-12 or max_proba_diff > 1e-12:
        raise AssertionError(
            f"Export mismatch too large: raw={max_raw_diff:.3e}, proba={max_proba_diff:.3e}"
        )
    if not np.array_equal(expected_cls, actual_cls):
        raise AssertionError("Exported model produced different class predictions")

    return max_proba_diff


def export_model(model_path: Path = DEFAULT_MODEL_PATH, output_path: Path = DEFAULT_OUTPUT_PATH) -> None:
    model_bytes = model_path.read_bytes()
    model_sha256 = hashlib.sha256(model_bytes).hexdigest()

    model = joblib.load(model_path)
    if not hasattr(model, "booster_"):
        raise TypeError(f"Expected a fitted LightGBM model with booster_, got {type(model).__name__}")

    booster = model.booster_
    dump = booster.dump_model()

    objective = str(dump.get("objective", ""))
    num_class = int(dump["num_class"])
    num_tree_per_iter = int(dump["num_tree_per_iteration"])
    if not objective.startswith("multiclass") or num_class != num_tree_per_iter:
        raise ValueError(
            f"Unsupported objective/layout: objective={objective!r}, "
            f"num_class={num_class}, num_tree_per_iteration={num_tree_per_iter}"
        )

    tree_info = dump["tree_info"]
    best_iter = int(getattr(model, "best_iteration_", 0) or 0)
    if best_iter > 0:
        tree_info = tree_info[: best_iter * num_tree_per_iter]

    classes = [int(c) for c in getattr(model, "classes_", range(num_class))]
    payload = {
        "format": "lgbm-multiclass-v1",
        "model_sha256": model_sha256,
        "num_class": num_class,
        "classes": classes,
        "average_output": bool(dump.get("average_output", False)),
        "feature_names": list(dump["feature_names"]),
        "trees": [serialize_tree(t["tree_structure"]) for t in tree_info],
    }

    # Round-trip through JSON before verification so IEEE-754 float parsing is tested too
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    roundtripped = json.loads(encoded)
    max_diff = verify_export(model, roundtripped)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(encoded, encoding="utf-8")
    size_kb = len(encoded.encode("utf-8")) / 1024
    print(
        f"Exported {len(payload['trees'])} trees ({num_class} classes, "
        f"{len(payload['feature_names'])} features) -> {output_path} "
        f"({size_kb:.1f} KB, max_proba_diff={max_diff:.3e})"
    )


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MODEL_PATH
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT_PATH
    export_model(src, dst)
