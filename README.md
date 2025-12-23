# DataLens Customizations для ООО "Аэронавигатор"

Этот репозиторий содержит все кастомизации для Yandex DataLens Open Source, адаптированные под нужды ООО "Аэронавигатор".

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

