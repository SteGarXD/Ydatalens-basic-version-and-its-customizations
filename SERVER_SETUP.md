# Инструкции по настройке на сервере Linux Ubuntu

Этот документ содержит пошаговые инструкции для настройки интеграции кастомизаций DataLens на сервере bi.aeronavigator.ru (Linux Ubuntu VM).

## Предварительные требования

- [ ] Доступ к серверу bi.aeronavigator.ru (SSH)
- [ ] Права sudo для установки пакетов
- [ ] DataLens установлен и работает
- [ ] Git установлен на сервере
- [ ] Репозитории созданы на GitHub:
  - `datalens-customizations` ✅
  - `datalens-basic` ✅

## Этап 1: Подготовка сервера

### 1.1 Подключение к серверу

```bash
ssh user@bi.aeronavigator.ru
# или
ssh user@<ip-address>
```

### 1.2 Установка необходимых инструментов

```bash
# Обновить пакеты
sudo apt update && sudo apt upgrade -y

# Установить Git (если не установлен)
sudo apt install -y git

# Установить дополнительные инструменты
sudo apt install -y curl wget jq
```

### 1.3 Создание директорий

```bash
# Создать директорию для кастомизаций
sudo mkdir -p /opt/datalens-customizations
sudo chown $USER:$USER /opt/datalens-customizations

# Проверить/создать директорию для DataLens (если нужно)
sudo mkdir -p /opt/datalens
```

## Этап 2: Клонирование репозитория кастомизаций

```bash
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations

# Установить права на скрипты
chmod +x scripts/*.sh
```

## Этап 3: Поиск и анализ DataLens на сервере

### 3.1 Поиск директории DataLens

```bash
# Поиск в стандартных местах
find /opt /usr/local /home -name "datalens" -type d 2>/dev/null

# Проверка Docker контейнеров
docker ps | grep datalens
docker inspect <container_id> | grep -i source

# Проверка systemd сервисов
systemctl list-units | grep datalens
systemctl status datalens* 2>/dev/null || true
```

### 3.2 Определение структуры

```bash
# После нахождения директории DataLens
DATALENS_DIR="/path/to/datalens"  # Замените на найденный путь

cd "$DATALENS_DIR"
ls -la

# Проверить структуру
ls -la frontend/ backend/ 2>/dev/null || echo "Структура может отличаться"
```

### 3.3 Определение версии DataLens

```bash
# Проверить версию в package.json
cat frontend/package.json | grep version || cat package.json | grep version

# Проверить версию в Docker (если используется)
docker inspect <container_id> | grep -i version
```

## Этап 4: Инициализация Git для базовой платформы

### 4.1 Запуск скрипта инициализации

```bash
cd /opt/datalens-customizations

# Установить переменную окружения с путем к DataLens
export DATALENS_DIR="/opt/datalens"  # Или найденный путь

# Запустить скрипт
./scripts/init-base-platform-git.sh
```

Скрипт выполнит:
- Инициализацию Git репозитория (если не существует)
- Создание .gitignore
- Определение версии DataLens
- Создание первого commit
- Настройку ветки main

### 4.2 Добавление remote и push

```bash
cd "$DATALENS_DIR"

# Добавить remote для datalens-basic
git remote add origin https://github.com/SteGarXD/datalens-basic.git

# Push в GitHub
git push -u origin main
```

Если возникнут проблемы с аутентификацией:

```bash
# Настроить SSH ключ или использовать Personal Access Token
# Для HTTPS с токеном:
git remote set-url origin https://<token>@github.com/SteGarXD/datalens-basic.git
```

### 4.3 Создание ветки для кастомизаций

```bash
cd "$DATALENS_DIR"

# Создать ветку
git checkout -b aeronavigator-customizations

# Push ветки
git push -u origin aeronavigator-customizations
```

### 4.4 Настройка upstream (опционально)

```bash
# Если нужен доступ к официальному репозиторию DataLens
git remote add upstream https://github.com/datalens-tech/datalens.git

# Проверить remotes
git remote -v
```

## Этап 5: Применение кастомизаций

### 5.1 Запуск скрипта применения

```bash
cd /opt/datalens-customizations

# Установить переменную окружения
export DATALENS_DIR="/opt/datalens"  # Или найденный путь

# Запустить скрипт
./scripts/apply-customizations.sh
```

Скрипт выполнит:
- Копирование кастомизаций в frontend/src/customizations/
- Копирование backend кастомизаций
- Копирование логотипа (если есть)
- Установку зависимостей
- Применение патчей

### 5.2 Ручная интеграция в код DataLens

#### Frontend интеграция

Найти главный файл приложения:

```bash
cd "$DATALENS_DIR/frontend/src"
ls -la index.tsx App.tsx main.tsx index.ts 2>/dev/null
```

Отредактировать найденный файл (например, `index.tsx`):

```bash
nano index.tsx  # или используйте ваш редактор
```

Добавить в начало файла:

```typescript
// Импорт кастомизаций
import { loadCustomizations } from './customizations';

// Загрузить кастомизации перед инициализацией
loadCustomizations().then(() => {
  // Существующий код инициализации приложения
  // ...
});
```

#### Backend интеграция

Найти главный файл API:

```bash
cd "$DATALENS_DIR/backend"
find . -name "__init__.py" -path "*/api/*" | head -1
```

Отредактировать файл и добавить:

```python
# Импорт кастомных роутеров
from .custom.file_upload import router as file_upload_router

# Регистрация роутеров
app.include_router(file_upload_router, prefix="/api/v1", tags=["file-upload"])
```

### 5.3 Установка зависимостей

```bash
# Frontend зависимости
cd "$DATALENS_DIR/frontend"
npm install

# Backend зависимости
cd "$DATALENS_DIR/backend"
pip install -r /opt/datalens-customizations/backend/requirements.txt
```

### 5.4 Применение миграций БД

```bash
# Для PostgreSQL
export PGPASSWORD='your_password'
psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/001_user_management.sql

psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/002_rbac.sql

psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/003_versioning.sql
```

## Этап 6: Пересборка и перезапуск

### 6.1 Пересборка frontend

```bash
cd "$DATALENS_DIR/frontend"
npm run build
```

### 6.2 Перезапуск сервисов

#### Вариант 1: Systemd

```bash
sudo systemctl restart datalens-frontend
sudo systemctl restart datalens-backend
```

#### Вариант 2: Docker Compose

```bash
cd "$DATALENS_DIR"
docker-compose restart frontend backend
```

#### Вариант 3: Docker контейнеры

```bash
docker restart datalens-frontend
docker restart datalens-backend
```

#### Вариант 4: Ручной перезапуск

```bash
# Найти процессы
ps aux | grep datalens

# Остановить и запустить заново (зависит от вашей конфигурации)
```

## Этап 7: Проверка интеграции

### 7.1 Проверка frontend

```bash
# Проверить логи
tail -f "$DATALENS_DIR/logs/frontend.log" || \
tail -f /var/log/datalens/frontend.log || \
journalctl -u datalens-frontend -f
```

### 7.2 Проверка backend

```bash
# Проверить API
curl http://localhost:8080/api/v1/file-upload/health || \
curl http://bi.aeronavigator.ru/api/v1/file-upload/health

# Проверить логи
tail -f "$DATALENS_DIR/logs/backend.log" || \
tail -f /var/log/datalens/backend.log || \
journalctl -u datalens-backend -f
```

### 7.3 Проверка в браузере

1. Откройте `http://bi.aeronavigator.ru` в браузере
2. Проверьте:
   - [ ] Логотип заменен на OP-compass.png
   - [ ] Цвета применены согласно брендбуку
   - [ ] Нет ошибок в консоли браузера (F12)
   - [ ] Все модули загружаются

## Этап 8: Настройка автоматических обновлений

### 8.1 Настройка cron для обновлений

```bash
# Открыть crontab
crontab -e

# Добавить задачу (каждое воскресенье в 2:00)
0 2 * * 0 cd /opt/datalens-customizations && ./scripts/update-datalens.sh >> /var/log/datalens-update.log 2>&1
```

### 8.2 Настройка webhook (опционально)

```bash
# Создать скрипт webhook
cat > /opt/datalens-customizations/webhook-deploy.sh << 'EOF'
#!/bin/bash
cd /opt/datalens-customizations
git pull origin main
export DATALENS_DIR=/opt/datalens
./scripts/apply-customizations.sh
EOF

chmod +x /opt/datalens-customizations/webhook-deploy.sh
```

## Решение проблем

### Проблема: Git не может подключиться к GitHub

**Решение:**
```bash
# Настроить SSH ключ
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Добавить ключ в GitHub Settings > SSH and GPG keys

# Или использовать Personal Access Token для HTTPS
git remote set-url origin https://<token>@github.com/SteGarXD/datalens-basic.git
```

### Проблема: Нет прав на запись в директорию DataLens

**Решение:**
```bash
# Изменить владельца
sudo chown -R $USER:$USER /opt/datalens

# Или добавить в группу
sudo usermod -aG datalens $USER
```

### Проблема: npm install не работает

**Решение:**
```bash
# Установить Node.js и npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверить версию
node --version
npm --version
```

### Проблема: pip install не работает

**Решение:**
```bash
# Установить pip
sudo apt install -y python3-pip

# Обновить pip
pip3 install --upgrade pip
```

## Дополнительные ресурсы

- `INTEGRATION_GUIDE.md` - подробное руководство по интеграции
- `DEPLOYMENT.md` - руководство по деплою
- `UPDATE_GUIDE.md` - руководство по обновлениям

## Поддержка

При возникновении проблем:
1. Проверьте логи: `/opt/datalens/logs/` или `/var/log/datalens/`
2. Проверьте статус сервисов: `systemctl status datalens-*`
3. Проверьте документацию в репозитории
4. Создайте issue в GitHub репозитории

