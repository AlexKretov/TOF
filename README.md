# 🏥 TOF — Рекомендательная система (тетрада Фалло)

Веб-приложение для подбора рекомендованной хирургической тактики при тетраде Фалло на основе клинических и эхокардиографических показателей пациента (модель LightGBM).

## 🌐 Онлайн-версия (GitHub Pages — 24/7, бесплатно)

Постоянный адрес приложения после включения GitHub Pages:

**https://alexkretov.github.io/TOF/**

- Работает круглосуточно (24/7) без «засыпания», регистрации и платных серверов.
- Все расчёты выполняются прямо в браузере — данные пациента никуда не передаются.
- Полностью совпадает по предобработке и предсказаниям с `app.py` и `model.pkl` (400 деревьев LightGBM, 4 класса).
- Поддерживает десктоп и мобильные устройства, ввод дробных чисел через точку или запятую и печать/сохранение результата в PDF.

### Включение GitHub Pages (один раз)

1. Влейте (Merge) Pull Request с папкой `docs/` в ветку `main`.
2. Откройте на GitHub **Settings** → **Pages** (`https://github.com/AlexKretov/TOF/settings/pages`).
3. В разделе **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`, папка `/docs` → нажмите **Save**.
4. Через 30–60 секунд сайт откроется по адресу **https://alexkretov.github.io/TOF/** и будет автоматически обновляться при каждом изменении в `main`.

## 🔄 Обновление ML-модели

Если вы переобучите модель и обновите `model.pkl`, пересоберите `docs/model.json` командой:

```bash
python scripts/export_model.py
```

Скрипт экспортирует деревья LightGBM в `docs/model.json` и автоматически проверяет точное совпадение вероятностей с исходной моделью. После этого закоммитьте обновлённый `docs/model.json` в `main`.

## 💻 Локальный запуск

### Веб-версия (`docs/`)

```bash
python -m http.server 8080 --directory docs
```

Откройте `http://localhost:8080`.

### Python / Gradio-версия (`app.py`)

```bash
pip install -r requirements.txt
python app.py
```

Откройте `http://localhost:7860`.

## 📁 Структура проекта

- `docs/` — автономное веб-приложение для GitHub Pages (`index.html`, `styles.css`, `app.js`, `model.json`, `favicon.svg`, `.nojekyll`).
- `scripts/export_model.py` — конвертер `model.pkl` → `docs/model.json` со встроенной проверкой точности.
- `app.py`, `model.pkl`, `requirements.txt` — исходная Python/Gradio-версия и обученная модель.
