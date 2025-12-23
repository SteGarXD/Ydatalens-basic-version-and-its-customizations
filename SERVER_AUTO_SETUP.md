# Автоматическая настройка на сервере - ОДНА КОМАНДА

## Быстрый старт

**На сервере Linux Ubuntu выполните:**

```bash
cd /opt && \
git clone https://github.com/SteGarXD/datalens-customizations.git 2>/dev/null || \
(cd datalens-customizations && git pull) && \
cd datalens-customizations && \
chmod +x scripts/auto-setup-unified-repo.sh && \
./scripts/auto-setup-unified-repo.sh
```

Или пошагово:

```bash
# 1. Клонировать кастомизации (если еще не клонированы)
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations

# 2. Сделать скрипт исполняемым
chmod +x scripts/auto-setup-unified-repo.sh

# 3. Запустить - ВСЁ АВТОМАТИЧЕСКИ!
./scripts/auto-setup-unified-repo.sh
```

## Что делает скрипт автоматически

1. ✅ Находит DataLens на сервере (автоматически ищет в /opt, /usr/local, /home)
2. ✅ Клонирует единый репозиторий `Ydatalens-basic-version-and-its-customizations`
3. ✅ Создает ветку `base` и копирует туда базовую версию DataLens с сервера
4. ✅ Создает ветку `customizations` и копирует туда все кастомизации
5. ✅ Объединяет их в ветку `integration`
6. ✅ Применяет кастомизации автоматически
7. ✅ Пушит всё в GitHub

## Результат

После выполнения на GitHub будет:

**Репозиторий:** https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations

**Ветки:**
- `base` - Базовая версия Yandex DataLens (скопирована с сервера)
- `customizations` - Все кастомизации и улучшения
- `integration` - Объединенная версия (готова для тестирования)

## После настройки

1. Проверьте ветки на GitHub
2. Протестируйте ветку `integration`
3. Если всё работает, объедините в `main`:

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations
git checkout main
git merge integration --no-ff -m "Release: DataLens with customizations"
git push origin main
```

## Решение проблем

### Если скрипт не находит DataLens

```bash
# Указать путь вручную
export DATALENS_DIR="/opt/datalens"  # Или ваш путь
./scripts/auto-setup-unified-repo.sh
```

### Если нужна аутентификация GitHub

```bash
# Настроить SSH ключ или использовать токен
git config --global credential.helper store
# При первом push ввести токен
```

### Если репозиторий не существует на GitHub

Создайте репозиторий на GitHub:
- Имя: `Ydatalens-basic-version-and-its-customizations`
- Видимость: Private (рекомендуется) или Public
- Не инициализируйте с README (скрипт сделает это)

## Важно

- ✅ Все кастомизации уже готовы локально
- ✅ Базовая версия будет скопирована с сервера автоматически
- ✅ Всё объединится в единый репозиторий
- ✅ Никаких ручных действий не требуется

