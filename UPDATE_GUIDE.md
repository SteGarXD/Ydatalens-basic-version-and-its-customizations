# Руководство по обновлению DataLens с сохранением кастомизаций

## Процесс обновления

### 1. Сохранить текущие изменения

```bash
git checkout aeronavigator-customizations
git add .
git commit -m "Aeronavigator customizations v1.0"
```

### 2. Получить обновления из upstream

```bash
git checkout main
git pull upstream main
```

### 3. Мердж изменений

```bash
git checkout aeronavigator-customizations
git merge main
# Разрешить конфликты вручную
```

### 4. Применить патчи

```bash
npm install
npx patch-package
```

### 5. Протестировать

```bash
npm run test
npm run build
```

### 6. Создать тег версии

```bash
git tag -a v1.1-aeronavigator -m "Updated to DataLens v1.1 with customizations"
```

## Автоматическое обновление

Используйте CI/CD pipeline (см. `.github/workflows/update-datalens.yml`) для автоматических обновлений.

## Разрешение конфликтов

При конфликтах приоритет отдается кастомизациям. Используйте `git mergetool` для визуального разрешения конфликтов.

