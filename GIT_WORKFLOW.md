# Git Workflow для обновлений DataLens

## Настройка репозитория

### 1. Клонирование и настройка upstream

```bash
# Клонируем официальный репозиторий DataLens
git clone https://github.com/datalens-tech/datalens.git
cd datalens

# Создаем свой форк (или используем внутренний репозиторий)
git remote add upstream https://github.com/datalens-tech/datalens
git remote add origin https://github.com/aeronavigator/datalens-custom

# Создаем ветку для кастомизаций
git checkout -b aeronavigator-customizations
```

### 2. Копирование кастомизаций

```bash
# Копируем структуру кастомизаций
cp -r ../datalens-customizations/customizations ./customizations
```

## Процесс обновления

### Шаг 1: Сохранить текущие изменения

```bash
git checkout aeronavigator-customizations
git add .
git commit -m "Aeronavigator customizations v1.0"
git push origin aeronavigator-customizations
```

### Шаг 2: Получить обновления из upstream

```bash
git checkout main
git pull upstream main
```

### Шаг 3: Мердж изменений

```bash
git checkout aeronavigator-customizations
git merge main
# Разрешить конфликты вручную
```

### Шаг 4: Применить патчи

```bash
npm install
npx patch-package
```

### Шаг 5: Протестировать

```bash
npm run test
npm run build
```

### Шаг 6: Создать тег версии

```bash
git tag -a v1.1-aeronavigator -m "Updated to DataLens v1.1 with customizations"
git push origin v1.1-aeronavigator
```

## Разрешение конфликтов

При конфликтах:
1. Приоритет отдается кастомизациям
2. Используйте `git mergetool` для визуального разрешения
3. Проверьте, что кастомизации не сломались после мерджа

## Автоматизация

Используйте CI/CD pipeline (`.github/workflows/update-datalens.yml`) для автоматических обновлений каждое воскресенье.

