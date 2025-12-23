# Руководство по использованию patch-package

## Установка

```bash
npm install --save-dev patch-package
```

## Создание патча

### 1. Внести изменения в node_modules

```bash
# Отредактировать файл в node_modules/@datalens/frontend/src/components/Header.tsx
# Например, заменить логотип
```

### 2. Создать патч

```bash
npx patch-package @datalens/frontend
```

Это создаст файл `patches/@datalens+frontend+1.0.0.patch`

### 3. Добавить в package.json

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

## Применение патчей

Патчи применяются автоматически при `npm install` благодаря `postinstall` скрипту.

## Структура патчей

```
patches/
└── @datalens+
    ├── frontend+1.0.0.patch
    └── backend+1.0.0.patch
```

## Обновление патчей

При обновлении пакета:
1. Удалите старый патч
2. Внесите изменения заново
3. Создайте новый патч

## Лучшие практики

- Используйте патчи только для мелких изменений
- Для крупных изменений используйте модульную архитектуру
- Документируйте каждый патч в комментариях

