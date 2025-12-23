# Тесты для кастомизаций DataLens

## Запуск тестов

```bash
# Установить зависимости
npm install

# Запустить все тесты
npm test

# Запустить тесты с покрытием
npm test -- --coverage

# Запустить конкретный тест
npm test -- file_upload.test.ts
```

## Структура тестов

- `file_upload.test.ts` - тесты для модуля загрузки файлов
- `rbac.test.ts` - тесты для RBAC модуля
- `cross_filtering.test.ts` - тесты для кросс-фильтрации
- `versioning.test.ts` - тесты для версионирования
- `branding.test.ts` - тесты для брендинга

## Покрытие

Цель: минимум 80% покрытия кода тестами.

