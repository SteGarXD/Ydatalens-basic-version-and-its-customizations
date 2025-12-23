# Инструкции для единого репозитория

## Репозиторий

**Единый репозиторий:** https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git

## Структура веток

1. **`base`** - Базовая версия Yandex DataLens (работающая на сервере)
2. **`customizations`** - Все кастомизации и улучшения
3. **`integration`** - Объединенная версия (для тестирования)
4. **`main`** - Финальная версия после успешного тестирования

## Быстрая настройка на сервере

### Автоматическая настройка (рекомендуется)

```bash
# На сервере Linux Ubuntu
cd /opt

# Клонировать репозиторий кастомизаций (для получения скрипта)
git clone https://github.com/SteGarXD/datalens-customizations.git

# Запустить скрипт настройки
cd datalens-customizations
chmod +x scripts/setup-unified-repo.sh

export DATALENS_DIR="/opt/datalens"  # Или найденный путь
export UNIFIED_REPO_DIR="/opt/Ydatalens-basic-version-and-its-customizations"
export CUSTOMIZATIONS_REPO="/opt/datalens-customizations"

./scripts/setup-unified-repo.sh
```

Скрипт автоматически:
- Клонирует единый репозиторий
- Создает ветку `base` с базовой версией DataLens
- Создает ветку `customizations` со всеми кастомизациями
- Пушит обе ветки в GitHub

### Ручная настройка

См. `UNIFIED_REPO_SETUP.md` для подробных инструкций.

## Объединение веток

После настройки обеих веток:

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations

# Создать ветку для объединения
git checkout base
git checkout -b integration

# Объединить кастомизации
git merge customizations --no-ff -m "Merge customizations into base"

# Применить кастомизации
chmod +x scripts/apply-customizations.sh
export DATALENS_DIR="$(pwd)"
./scripts/apply-customizations.sh

# Интегрировать в код (см. UNIFIED_REPO_SETUP.md)

# Закоммитить
git add .
git commit -m "Integrate customizations into base DataLens"
git push -u origin integration
```

## Тестирование

После объединения протестируйте:

1. Установите зависимости
2. Примените миграции БД
3. Пересоберите frontend
4. Перезапустите сервисы
5. Проверьте функциональность

## Слияние в main

После успешного тестирования:

```bash
git checkout main
git merge integration --no-ff -m "Release: DataLens with customizations"
git push origin main
```

## Документация

- `UNIFIED_REPO_SETUP.md` - подробная инструкция по настройке
- `INTEGRATION_GUIDE.md` - руководство по интеграции
- `DEPLOYMENT.md` - руководство по деплою
- `SERVER_SETUP.md` - инструкции для сервера

