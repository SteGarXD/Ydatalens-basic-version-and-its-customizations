# DataLens Customizations для ООО "Аэронавигатор"

Этот репозиторий содержит все кастомизации для Yandex DataLens Open Source, адаптированные под нужды ООО "Аэронавигатор".

**GitHub:** https://github.com/SteGarXD/datalens-customizations

## Структура

```
datalens-customizations/
├── customizations/
│   ├── aeronavigator/          # Кастомизации для ООО "Аэронавигатор"
│   │   ├── branding/           # Брендинг и логотипы
│   │   ├── features/           # Дополнительные функции
│   │   ├── flight-analytics/   # Специфичные функции для авиации
│   │   ├── integrations/       # Интеграции с другими системами
│   │   └── config.ts           # Конфигурация кастомизаций
│   ├── patches/                # Патчи для мелких изменений
│   └── migrations/             # Миграции для обновлений
└── README.md
```

## Установка

1. Клонируйте официальный репозиторий DataLens:
```bash
git clone https://github.com/datalens-tech/datalens.git
cd datalens
```

2. Скопируйте кастомизации:
```bash
cp -r ../datalens-customizations/customizations ./customizations
```

3. Установите зависимости:
```bash
npm install
```

4. Примените патчи (если есть):
```bash
npx patch-package
```

## Использование

Все кастомизации загружаются автоматически через feature flags в `config.ts`.

## Обновления

См. `UPDATE_GUIDE.md` для инструкций по обновлению DataLens с сохранением кастомизаций.

## Интеграция и деплой

- `INTEGRATION_GUIDE.md` - подробное руководство по интеграции кастомизаций в DataLens
- `DEPLOYMENT.md` - руководство по деплою на сервер bi.aeronavigator.ru
- `scripts/apply-customizations.sh` - скрипт для применения кастомизаций
- `scripts/update-datalens.sh` - скрипт для обновления DataLens с сохранением кастомизаций

## Быстрый старт

### Применение кастомизаций

```bash
# Клонировать репозиторий
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations

# Применить кастомизации
chmod +x scripts/apply-customizations.sh
DATALENS_DIR=/opt/datalens ./scripts/apply-customizations.sh
```

## CI/CD

Репозиторий настроен с GitHub Actions:
- Автоматическое обновление из upstream (каждое воскресенье)
- Автоматический деплой при push в main
- См. `.github/workflows/` для деталей

