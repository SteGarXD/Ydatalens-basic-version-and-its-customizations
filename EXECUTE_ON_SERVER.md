# Выполнить на сервере - ОДНА КОМАНДА

## Подключитесь к серверу

```bash
ssh user@bi.aeronavigator.ru
# или
ssh user@<ip-address>
```

## Выполните эту команду (скопируйте целиком):

```bash
cd /opt && git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git 2>/dev/null || (cd Ydatalens-basic-version-and-its-customizations && git pull) && cd Ydatalens-basic-version-and-its-customizations && git checkout customizations 2>/dev/null || git fetch origin customizations:customizations && chmod +x scripts/auto-setup-server.sh && ./scripts/auto-setup-server.sh
```

## Или пошагово (если одна команда не работает):

```bash
# 1. Перейти в /opt
cd /opt

# 2. Клонировать репозиторий
git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
cd Ydatalens-basic-version-and-its-customizations

# 3. Переключиться на ветку customizations
git checkout customizations

# 4. Сделать скрипт исполняемым
chmod +x scripts/auto-setup-server.sh

# 5. Запустить автоматическую настройку
./scripts/auto-setup-server.sh
```

## Что сделает скрипт:

1. ✅ Автоматически найдет DataLens на сервере
2. ✅ Создаст ветку `master` с базовой версией
3. ✅ Запушит её в GitHub

## Результат:

После выполнения на GitHub будут обе ветки:
- `master` - Базовая версия DataLens (с сервера)
- `customizations` - Все кастомизации (уже есть)

## Если нужна аутентификация GitHub:

```bash
# Настроить SSH ключ
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Добавить ключ в GitHub Settings > SSH and GPG keys

# Или использовать токен для HTTPS
git remote set-url origin https://USERNAME:TOKEN@github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
```

