# Единый репозиторий с двумя ветками

## Репозиторий

**URL:** https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git

## Структура веток

### Ветка 1: `base`
**Базовая версия Yandex DataLens**

Содержит:
- Оригинальную on-premise версию Yandex DataLens
- Без кастомизаций
- Чистая версия с сервера

### Ветка 2: `customizations`
**Все кастомизации и улучшения**

Содержит:
- Все кастомизации для ООО "Аэронавигатор"
- Новые функции и улучшения
- Backend сервисы
- Frontend модули
- Миграции БД
- Скрипты деплоя
- Всю документацию

## Быстрая настройка на сервере

### Одна команда - всё автоматически:

```bash
cd /opt && \
git clone https://github.com/SteGarXD/datalens-customizations.git && \
cd datalens-customizations && \
chmod +x scripts/setup-two-branches.sh && \
./scripts/setup-two-branches.sh
```

Скрипт автоматически:
1. ✅ Найдет DataLens на сервере
2. ✅ Клонирует единый репозиторий
3. ✅ Создаст ветку `base` с базовой версией
4. ✅ Создаст ветку `customizations` со всеми кастомизациями
5. ✅ Запушит обе ветки в GitHub

## Использование

### Просмотр базовой версии

```bash
git checkout base
```

### Просмотр кастомизаций

```bash
git checkout customizations
```

### Объединение (когда готово)

```bash
# Переключиться на base
git checkout base

# Объединить кастомизации
git merge customizations

# Применить кастомизации (если нужно)
./scripts/apply-customizations.sh

# Закоммитить объединенную версию
git add .
git commit -m "Merge customizations into base"
git push origin base
```

## Структура репозитория

```
Ydatalens-basic-version-and-its-customizations/
├── [base branch]
│   ├── frontend/          # Базовая версия
│   ├── backend/           # Базовая версия
│   └── ...                # Остальные файлы DataLens
│
└── [customizations branch]
    ├── customizations/    # Все кастомизации
    ├── backend/           # Backend сервисы
    ├── scripts/           # Скрипты деплоя
    └── ...                # Документация и файлы
```

## Важно

- ✅ Две отдельные ветки - базовая версия и кастомизации
- ✅ Можно работать с каждой веткой независимо
- ✅ Объединение только когда готово к тестированию
- ✅ Всё автоматически через один скрипт

