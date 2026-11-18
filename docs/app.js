// Рекомендательная система: хирургическая тактика при тетраде Фалло
// Полный порт предобработки из app.py + точный инференс LightGBM (model.json) в браузере.

// Справочная таблица центилей (идентично WEIGHT_CENTILE_DATA в app.py)
const WEIGHT_CENTILE_ROWS = [
  { age: 0,    c3: 2.6,  c10: 2.8,  c25: 3.0,  c50: 3.3,  c75: 3.7,  c90: 3.9,  c97: 4.1  },
  { age: 30,   c3: 3.3,  c10: 3.6,  c25: 3.8,  c50: 4.2,  c75: 4.5,  c90: 4.7,  c97: 5.1  },
  { age: 60,   c3: 3.8,  c10: 4.2,  c25: 4.5,  c50: 4.8,  c75: 5.2,  c90: 5.5,  c97: 5.9  },
  { age: 90,   c3: 4.4,  c10: 4.8,  c25: 5.2,  c50: 5.5,  c75: 5.9,  c90: 6.3,  c97: 6.7  },
  { age: 120,  c3: 5.0,  c10: 5.4,  c25: 5.8,  c50: 6.2,  c75: 6.6,  c90: 7.0,  c97: 7.5  },
  { age: 150,  c3: 5.5,  c10: 5.9,  c25: 6.3,  c50: 6.7,  c75: 7.2,  c90: 7.7,  c97: 8.1  },
  { age: 180,  c3: 5.9,  c10: 6.3,  c25: 6.8,  c50: 7.3,  c75: 7.8,  c90: 8.3,  c97: 8.7  },
  { age: 210,  c3: 6.4,  c10: 6.8,  c25: 7.3,  c50: 7.7,  c75: 8.4,  c90: 8.9,  c97: 9.3  },
  { age: 240,  c3: 6.7,  c10: 7.2,  c25: 7.6,  c50: 8.2,  c75: 8.8,  c90: 9.3,  c97: 9.7  },
  { age: 270,  c3: 7.1,  c10: 7.5,  c25: 8.0,  c50: 8.6,  c75: 9.2,  c90: 9.7,  c97: 10.1 },
  { age: 300,  c3: 7.4,  c10: 7.9,  c25: 8.4,  c50: 9.0,  c75: 9.6,  c90: 10.1, c97: 10.5 },
  { age: 330,  c3: 7.7,  c10: 8.3,  c25: 8.7,  c50: 9.3,  c75: 9.9,  c90: 10.5, c97: 10.9 },
  { age: 360,  c3: 8.0,  c10: 8.5,  c25: 9.0,  c50: 9.6,  c75: 10.2, c90: 10.8, c97: 11.3 },
  { age: 450,  c3: 8.6,  c10: 9.2,  c25: 9.7,  c50: 10.8, c75: 10.9, c90: 11.5, c97: 12.1 },
  { age: 540,  c3: 9.2,  c10: 9.8,  c25: 10.3, c50: 10.8, c75: 11.5, c90: 12.2, c97: 12.8 },
  { age: 630,  c3: 9.7,  c10: 10.3, c25: 10.6, c50: 11.5, c75: 12.2, c90: 12.8, c97: 13.4 },
  { age: 720,  c3: 10.2, c10: 10.8, c25: 11.3, c50: 12.1, c75: 12.8, c90: 13.5, c97: 14.1 },
  { age: 810,  c3: 10.6, c10: 11.2, c25: 11.7, c50: 12.6, c75: 13.3, c90: 14.2, c97: 14.8 },
  { age: 900,  c3: 11.0, c10: 11.6, c25: 12.3, c50: 13.2, c75: 13.9, c90: 14.8, c97: 15.5 },
  { age: 990,  c3: 11.5, c10: 12.1, c25: 12.7, c50: 13.7, c75: 15.5, c90: 16.5, c97: 16.3 },
  { age: 1080, c3: 11.7, c10: 12.5, c25: 13.3, c50: 13.7, c75: 16.4, c90: 17.7, c97: 17.6 },
  { age: 1260, c3: 12.3, c10: 13.4, c25: 14.0, c50: 15.0, c75: 16.4, c90: 17.7, c97: 18.6 },
  { age: 1440, c3: 13.0, c10: 14.0, c25: 14.8, c50: 15.9, c75: 17.6, c90: 18.9, c97: 20.0 },
  { age: 1620, c3: 13.9, c10: 14.8, c25: 15.8, c50: 16.9, c75: 18.5, c90: 20.3, c97: 21.5 },
  { age: 1800, c3: 14.7, c10: 15.7, c25: 16.6, c50: 18.1, c75: 19.7, c90: 21.6, c97: 23.2 },
  { age: 1980, c3: 15.5, c10: 16.6, c25: 17.7, c50: 19.3, c75: 21.1, c90: 23.1, c97: 25.1 },
  { age: 2160, c3: 16.3, c10: 17.4, c25: 18.7, c50: 20.4, c75: 22.5, c90: 24.8, c97: 27.1 },
  { age: 2340, c3: 17.1, c10: 18.3, c25: 19.7, c50: 21.5, c75: 23.8, c90: 26.5, c97: 29.3 },
  { age: 2520, c3: 17.9, c10: 19.4, c25: 20.6, c50: 22.7, c75: 25.3, c90: 28.3, c97: 31.6 },
  { age: 2880, c3: 20.0, c10: 21.4, c25: 23.0, c50: 25.1, c75: 28.5, c90: 32.1, c97: 36.3 },
  { age: 3240, c3: 21.9, c10: 23.4, c25: 25.5, c50: 28.2, c75: 32.0, c90: 36.3, c97: 41.0 },
  { age: 3600, c3: 22.7, c10: 25.0, c25: 27.7, c50: 30.6, c75: 34.9, c90: 39.8, c97: 47.4 },
  { age: 3960, c3: 24.9, c10: 27.8, c25: 30.7, c50: 34.3, c75: 38.9, c90: 44.6, c97: 55.2 },
  { age: 4320, c3: 27.8, c10: 31.8, c25: 36.0, c50: 40.0, c75: 45.4, c90: 51.8, c97: 63.4 },
  { age: 4320, c3: 32.0, c10: 38.7, c25: 43.0, c50: 47.5, c75: 52.5, c90: 59.0, c97: 69.0 },
  { age: 5040, c3: 37.6, c10: 43.8, c25: 48.2, c50: 52.8, c75: 58.0, c90: 64.0, c97: 72.2 },
  { age: 5400, c3: 42.0, c10: 46.8, c25: 50.6, c50: 55.2, c75: 60.4, c90: 66.5, c97: 74.9 },
  { age: 5760, c3: 45.2, c10: 48.4, c25: 51.8, c50: 56.5, c75: 61.3, c90: 67.6, c97: 75.6 },
  { age: 6120, c3: 46.2, c10: 49.2, c25: 52.9, c50: 57.3, c75: 61.9, c90: 68.0, c97: 76.0 },
];

const AGE_RANGES = WEIGHT_CENTILE_ROWS.map((r) => r.age);

export const RESULT_MAP = {
  0: {
    name: "Радикальная коррекция",
    shortName: "Радикальная коррекция",
    emoji: "✅",
    cssClass: "tactic-0",
  },
  1: {
    name: "Реконструкция путей оттока правого желудочка",
    shortName: "Реконструкция путей оттока ПЖ",
    emoji: "🔧",
    cssClass: "tactic-1",
  },
  2: {
    name: "Системно-лёгочный анастомоз",
    shortName: "Системно-лёгочный анастомоз",
    emoji: "🔗",
    cssClass: "tactic-2",
  },
  3: {
    name: "Транслюминальная баллонная вальвулопластика клапана лёгочной артерии / стентирование выводного отдела правого желудочка",
    shortName: "Баллонная вальвулопластика / стентирование",
    emoji: "💉",
    cssClass: "tactic-3",
  },
};

export function findCentile(ageBucket, value) {
  const match = WEIGHT_CENTILE_ROWS.find((row) => row.age === ageBucket);
  if (!match) {
    return NaN;
  }
  const { c3, c10, c25, c50, c75, c90, c97 } = match;
  if (value < c50) {
    if (value < c25) {
      return value < c10 ? 10 : 25;
    }
    return 25;
  } else if (value > c50) {
    if (value < c75) return 50;
    if (value < c90) return 75;
    if (value < c97) return 90;
    return 97;
  } else if (value < c10) {
    return value <= c3 ? 3 : 10;
  }
  // В app.py возвращается None -> object-колонка из 1 строки -> LabelEncoder кодирует в 0
  return 0;
}

export function preprocessFeatures(input) {
  const возраст = Number(input.возраст);
  const рост = Number(input.рост);
  const бса = Number(input.бса);
  const О2капиляр = Number(input.О2капиляр);
  const одышцианприст = Number(input.одышцианприст);
  const фвлжпервич = Number(input.фвлжпервич);
  const кдрлж = Number(input.кдрлж);
  const ксрлж = Number(input.ксрлж);
  const кдолж = Number(input.кдолж);
  const устьеПЛА = Number(input.устьеПЛА);
  const УстьеЛЛА = Number(input.УстьеЛЛА);
  const ствол_ла = Number(input.ствол_ла);
  const фк_ла = Number(input.фк_ла);
  const градиентдавленияпжла = Number(input.градиентдавленияпжла);
  const дмжпмм = Number(input.дмжпмм);
  const давлениеПЖ = Number(input.давлениеПЖ);
  const ЛАИ = Number(input.ЛАИ);
  const ABнАо = Number(input.ABнАо);

  const весEffective = возраст < 75 ? 0 : 1;
  const logVal = Math.log(ABнАо * ЛАИ + 1e-9);
  const odyshEncoded = одышцианприст === 2 ? 1 : одышцианприст === 1 ? 0 : Math.trunc(одышцианприст);

  const v = Math.trunc(возраст);
  let bucket = -1;
  for (let i = 0; i < AGE_RANGES.length; i += 1) {
    if (v <= AGE_RANGES[i]) {
      bucket = AGE_RANGES[i];
      break;
    }
  }

  const центилиВес = findCentile(bucket, весEffective);
  const центилиРост = findCentile(bucket, рост);

  const возрМес = возраст / 30;
  const от1месДо1года = возрМес > 1 && возрМес <= 12 ? 1 : 0;
  const gradCapped = градиентдавленияпжла <= 100 ? градиентдавленияпжла : 100;

  // В app.py колонка 'пол' приводится к category и на 1-строчном DataFrame
  // LabelEncoder().fit_transform(...) всегда даёт 0.
  const полEncoded = 0;

  return {
    "1мес_1год": от1месДо1года,
    ABнАо,
    log: logVal,
    ЛАИ,
    О2капиляр,
    УстьеЛЛА,
    бса,
    возр_мес: возрМес,
    градиентдавленияпжла: gradCapped,
    давлениеПЖ,
    дмжпмм,
    кдолж,
    кдрлж,
    ксрлж,
    одышцианприст: odyshEncoded,
    пол: полEncoded,
    ствол_ла,
    устьеПЛА,
    фвлжпервич,
    фк_ла,
    центили_вес: центилиВес,
    центили_рост: центилиРост,
  };
}

function evalTree(tree, features) {
  const splitFeatures = tree.f;
  if (splitFeatures.length === 0) {
    return tree.v[0];
  }
  const thresholds = tree.t;
  const left = tree.l;
  const right = tree.r;
  const leaves = tree.v;
  const missing = tree.m;
  const defaultLeft = tree.d;

  let idx = 0;
  while (idx >= 0) {
    const val = features[splitFeatures[idx]];
    const isNan = Number.isNaN(val);
    const mCode = missing ? missing[idx] : 0;
    let goLeft;

    if (mCode === 2 && isNan) {
      goLeft = Boolean(defaultLeft[idx]);
    } else if (mCode === 1 && (isNan || val === 0)) {
      goLeft = Boolean(defaultLeft[idx]);
    } else {
      const fval = isNan ? 0.0 : val;
      goLeft = fval <= thresholds[idx];
    }

    idx = goLeft ? left[idx] : right[idx];
  }
  return leaves[-1 - idx];
}

export function predictModel(model, input) {
  const featureMap = preprocessFeatures(input);
  const vector = model.feature_names.map((name) => {
    if (!(name in featureMap)) {
      throw new Error(`Неизвестный признак модели: ${name}`);
    }
    return featureMap[name];
  });

  const numClass = model.num_class;
  const rawScores = new Float64Array(numClass);
  const trees = model.trees;

  for (let i = 0; i < trees.length; i += 1) {
    rawScores[i % numClass] += evalTree(trees[i], vector);
  }

  if (model.average_output && trees.length >= numClass) {
    const numIter = trees.length / numClass;
    for (let c = 0; c < numClass; c += 1) {
      rawScores[c] /= numIter;
    }
  }

  // Численно устойчивый softmax
  let maxScore = -Infinity;
  for (let c = 0; c < numClass; c += 1) {
    if (rawScores[c] > maxScore) maxScore = rawScores[c];
  }
  const probabilities = new Array(numClass);
  let sumExp = 0;
  for (let c = 0; c < numClass; c += 1) {
    const e = Math.exp(rawScores[c] - maxScore);
    probabilities[c] = e;
    sumExp += e;
  }
  let bestIdx = 0;
  for (let c = 0; c < numClass; c += 1) {
    probabilities[c] /= sumExp;
    if (probabilities[c] > probabilities[bestIdx]) {
      bestIdx = c;
    }
  }

  const predictedClass = model.classes ? model.classes[bestIdx] : bestIdx;
  return {
    predictedClass,
    probabilities,
    rawScores: Array.from(rawScores),
    featureMap,
  };
}

// ============================================================
//                  РАБОТА С ИНТЕРФЕЙСОМ БРАУЗЕРА
// ============================================================

const NUMERIC_FIELDS = [
  { id: "возраст", label: "Возраст (дни)" },
  { id: "вес", label: "Вес (кг)" },
  { id: "рост", label: "Рост (см)" },
  { id: "бса", label: "БСА" },
  { id: "гествозраст", label: "Гестационный возраст (дни)" },
  { id: "О2капиляр", label: "SpO₂ (%)" },
  { id: "фвлжпервич", label: "ФВ ЛЖ (%)" },
  { id: "кдрлж", label: "КДР ЛЖ (см)" },
  { id: "ксрлж", label: "КСР ЛЖ (см)" },
  { id: "кдолж", label: "КДО ЛЖ (мм)" },
  { id: "устьеПЛА", label: "Устье ПЛА (мм)" },
  { id: "УстьеЛЛА", label: "Устье ЛЛА (мм)" },
  { id: "ствол_ла", label: "Ствол ЛА (мм)" },
  { id: "фк_ла", label: "ФК ЛА (мм)" },
  { id: "градиентдавленияпжла", label: "Градиент ПЖ/ЛА" },
  { id: "дмжпмм", label: "ДМЖП (мм)" },
  { id: "давлениеПЖ", label: "Давление ПЖ" },
  { id: "ЛАИ", label: "ЛАИ" },
  { id: "ABнАо", label: "ABнАо" },
];

function parseDecimal(raw) {
  const cleaned = String(raw ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  if (cleaned === "") {
    return { ok: true, value: 0 };
  }
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(cleaned)) {
    return { ok: false, value: NaN };
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return { ok: false, value: NaN };
  }
  return { ok: true, value: num };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(val) {
  if (Object.is(val, -0)) return "0";
  return String(val);
}

function initApp() {
  const form = document.getElementById("tof-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const toggleAllBtn = document.getElementById("toggle-sections-btn");
  const printBtn = document.getElementById("print-btn");
  const statusPill = document.getElementById("model-status");
  const statusText = document.getElementById("model-status-text");
  const dataOut = document.getElementById("display-out");
  const resultOut = document.getElementById("result-out");
  const resultsSection = document.getElementById("results-section");
  const accordions = Array.from(document.querySelectorAll("details.accordion"));

  let loadedModel = null;
  let modelLoadError = null;

  // Загружаем модель
  fetch("./model.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then((json) => {
      loadedModel = json;
      statusPill.classList.add("is-ready");
      statusText.textContent = "Модель готова · расчёт локально в браузере";
      submitBtn.disabled = false;
    })
    .catch((err) => {
      modelLoadError = err.message || String(err);
      statusPill.classList.add("is-error");
      statusText.textContent = "Ошибка загрузки модели";
      submitBtn.disabled = false;
    });

  // Удобное выделение значения «0» при фокусе и живая очистка ошибок
  for (const field of NUMERIC_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;

    el.addEventListener("focus", () => {
      if (el.value.trim() === "0") {
        el.select();
      }
    });

    el.addEventListener("blur", () => {
      if (el.value.trim() === "") {
        el.value = "0";
      }
    });

    el.addEventListener("input", () => {
      if (el.classList.contains("is-invalid")) {
        const check = parseDecimal(el.value);
        if (check.ok) {
          el.classList.remove("is-invalid");
          el.removeAttribute("aria-invalid");
          const errNode = el.parentElement.querySelector(".field-error");
          if (errNode) errNode.textContent = "";
        }
      }
    });
  }

  // Управление раскрытием разделов
  function syncToggleLabel() {
    const allOpen = accordions.every((acc) => acc.open);
    toggleAllBtn.textContent = allOpen ? "Свернуть доп. разделы" : "Развернуть все разделы";
  }

  for (const acc of accordions) {
    acc.addEventListener("toggle", syncToggleLabel);
  }
  syncToggleLabel();

  toggleAllBtn.addEventListener("click", () => {
    const allOpen = accordions.every((acc) => acc.open);
    accordions.forEach((acc, idx) => {
      acc.open = allOpen ? idx < 2 : true;
    });
    syncToggleLabel();
  });

  // Сброс формы
  resetBtn.addEventListener("click", () => {
    form.reset();
    for (const field of NUMERIC_FIELDS) {
      const el = document.getElementById(field.id);
      if (!el) continue;
      el.value = "0";
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
      const errNode = el.parentElement.querySelector(".field-error");
      if (errNode) errNode.textContent = "";
    }
    dataOut.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        Заполните показатели пациента и нажмите «Получить рекомендацию»
      </div>`;
    resultOut.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🩺</div>
        Здесь появится рекомендованная хирургическая тактика
      </div>`;
    printBtn.hidden = true;
  });

  // Печать
  printBtn.addEventListener("click", () => {
    window.print();
  });

  function renderDisplayTable(rows) {
    const bodyHtml = rows
      .map(([param, val, isMuted]) => {
        const cls = isMuted ? ' class="is-muted"' : "";
        return `<tr><td>${escapeHtml(param)}</td><td${cls}>${escapeHtml(val)}</td></tr>`;
      })
      .join("");
    dataOut.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Параметр</th><th>Значение</th></tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>`;
  }

  function renderError(message) {
    resultOut.innerHTML = `
      <div class="result-content">
        <div class="error-box" role="alert">
          ❌ <strong>Ошибка:</strong> ${escapeHtml(message)}
        </div>
      </div>`;
    printBtn.hidden = true;
  }

  function renderRecommendation(prediction) {
    const { predictedClass, probabilities } = prediction;
    const info = RESULT_MAP[predictedClass];
    const topProbPct = (probabilities[predictedClass] * 100).toFixed(1);

    const sortedClasses = Object.keys(RESULT_MAP)
      .map((k) => Number(k))
      .sort((a, b) => probabilities[b] - probabilities[a]);

    const barsHtml = sortedClasses
      .map((cls) => {
        const item = RESULT_MAP[cls];
        const pct = probabilities[cls] * 100;
        const pctLabel = `${pct.toFixed(1)}%`;
        const widthPct = Math.max(pct, pct > 0.05 ? 1.2 : 0).toFixed(2);
        const topClass = cls === predictedClass ? " is-top" : "";
        return `
          <div class="proba-item${topClass}">
            <div class="proba-row">
              <span class="proba-label">${item.emoji} ${escapeHtml(item.shortName)}</span>
              <span class="proba-value">${pctLabel}</span>
            </div>
            <div class="proba-track">
              <div class="proba-fill ${item.cssClass}" style="width:${widthPct}%"></div>
            </div>
          </div>`;
      })
      .join("");

    resultOut.innerHTML = `
      <div class="result-content">
        <div class="recommendation-card ${info.cssClass}" role="status" aria-live="polite">
          <div class="rec-emoji" aria-hidden="true">${info.emoji}</div>
          <div class="rec-kicker">Рекомендованная тактика</div>
          <div class="rec-title">${escapeHtml(info.name)}</div>
          <div class="rec-confidence">Уверенность модели: ${topProbPct}%</div>
        </div>
        <div class="proba-section">
          <h3 class="proba-heading">Распределение вероятностей</h3>
          <div class="proba-list">${barsHtml}</div>
        </div>
      </div>`;
    printBtn.hidden = false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = {};
    let firstInvalidEl = null;

    for (const field of NUMERIC_FIELDS) {
      const el = document.getElementById(field.id);
      const parsed = parseDecimal(el.value);
      let errNode = el.parentElement.querySelector(".field-error");
      if (!parsed.ok) {
        el.classList.add("is-invalid");
        el.setAttribute("aria-invalid", "true");
        if (!errNode) {
          errNode = document.createElement("div");
          errNode.className = "field-error";
          el.parentElement.appendChild(errNode);
        }
        errNode.textContent = "Введите число (например, 12.5)";
        const parentDetails = el.closest("details.accordion");
        if (parentDetails) parentDetails.open = true;
        if (!firstInvalidEl) firstInvalidEl = el;
      } else {
        el.classList.remove("is-invalid");
        el.removeAttribute("aria-invalid");
        if (errNode) errNode.textContent = "";
        values[field.id] = parsed.value;
      }
    }

    if (firstInvalidEl) {
      syncToggleLabel();
      firstInvalidEl.focus();
      return;
    }

    const polRadio = form.querySelector('input[name="пол"]:checked');
    const odyshRadio = form.querySelector('input[name="одышцианприст"]:checked');
    values.пол = polRadio ? Number(polRadio.value) : 1;
    values.одышцианприст = odyshRadio ? Number(odyshRadio.value) : 1;
    values.сопвпс = document.getElementById("сопвпс").value.trim();
    values.створкиклЛА = document.getElementById("створкиклЛА").value.trim();

    const displayRows = [
      ["Пол", values.пол === 1 ? "Мужской" : "Женский", false],
      ["Возраст (дни)", formatNumber(values.возраст), false],
      ["Вес (кг)", formatNumber(values.вес), false],
      ["Рост (см)", formatNumber(values.рост), false],
      ["БСА", formatNumber(values.бса), false],
      ["Сопутствующие ВПС", values.сопвпс || "—", !values.сопвпс],
      ["Гестационный возраст (дни)", formatNumber(values.гествозраст), false],
      ["SpO₂ (%)", formatNumber(values.О2капиляр), false],
      ["Одышка/цианоз", values.одышцианприст === 2 ? "Есть" : "Нет", false],
      ["ФВ ЛЖ (%)", formatNumber(values.фвлжпервич), false],
      ["КДР ЛЖ (см)", formatNumber(values.кдрлж), false],
      ["КСР ЛЖ (см)", formatNumber(values.ксрлж), false],
      ["КДО ЛЖ (мм)", formatNumber(values.кдолж), false],
      ["Устье ПЛА (мм)", formatNumber(values.устьеПЛА), false],
      ["Устье ЛЛА (мм)", formatNumber(values.УстьеЛЛА), false],
      ["Ствол ЛА (мм)", formatNumber(values.ствол_ла), false],
      ["ФК ЛА (мм)", formatNumber(values.фк_ла), false],
      ["Створки ЛА", values.створкиклЛА || "—", !values.створкиклЛА],
      ["Градиент ПЖ/ЛА", formatNumber(values.градиентдавленияпжла), false],
      ["ДМЖП (мм)", formatNumber(values.дмжпмм), false],
      ["Давление ПЖ", formatNumber(values.давлениеПЖ), false],
      ["ЛАИ", formatNumber(values.ЛАИ), false],
      ["ABнАо", formatNumber(values.ABнАо), false],
    ];

    renderDisplayTable(displayRows);

    if (!loadedModel) {
      renderError(
        `Модель не загружена. Обновите страницу или проверьте наличие файла model.json${
          modelLoadError ? ` (${modelLoadError})` : ""
        }.`
      );
      return;
    }

    try {
      const prediction = predictModel(loadedModel, values);
      renderRecommendation(prediction);
      if (window.innerWidth < 960) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      renderError(err.message || String(err));
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}
