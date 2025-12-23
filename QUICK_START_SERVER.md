# Быстрый старт для сервера

Краткая инструкция для быстрого запуска интеграции на сервере Linux Ubuntu.

## Предварительные требования

- Доступ к серверу bi.aeronavigator.ru
- DataLens установлен и работает
- Git установлен

## Быстрая установка (5 шагов)

### 1. Клонировать репозиторий кастомизаций

```bash
cd /opt
sudo git clone https://github.com/SteGarXD/datalens-customizations.git
sudo chown -R $USER:$USER datalens-customizations
cd datalens-customizations
chmod +x scripts/*.sh
```

### 2. Найти директорию DataLens

```bash
# Автоматический поиск
find /opt /usr/local /home -name "datalens" -type d 2>/dev/null | head -1

# Или проверьте Docker
docker ps | grep datalens

# Установите переменную
export DATALENS_DIR="/opt/datalens"  # Замените на найденный путь
```

### 3. Инициализировать Git для базовой платформы

```bash
cd /opt/datalens-customizations
./scripts/init-base-platform-git.sh

# После выполнения скрипта:
cd "$DATALENS_DIR"
git remote add origin https://github.com/SteGarXD/datalens-basic.git
git push -u origin main
git checkout -b aeronavigator-customizations
git push -u origin aeronavigator-customizations
```

### 4. Применить кастомизации

```bash
cd /opt/datalens-customizations
export DATALENS_DIR="/opt/datalens"  # Или найденный путь
./scripts/apply-customizations.sh
```

### 5. Интегрировать в код и перезапустить

#### Frontend интеграция

```bash
# Найти главный файл
cd "$DATALENS_DIR/frontend/src"
MAIN_FILE=$(ls index.tsx App.tsx main.tsx index.ts 2>/dev/null | head -1)

# Добавить загрузку кастомизаций (отредактировать файл)
# Добавить в начало: import { loadCustomizations } from './customizations';
# Вызвать: loadCustomizations().then(() => { /* существующий код */ });
```

#### Backend интеграция

```bash
# Найти файл API
cd "$DATALENS_DIR/backend"
API_FILE=$(find . -name "__init__.py" -path "*/api/*" | head -1)

# Добавить регистрацию роутеров (отредактировать файл)
# from .custom.file_upload import router as file_upload_router
# app.include_router(file_upload_router, prefix="/api/v1", tags=["file-upload"])
```

#### Установить зависимости и пересобрать

```bash
# Frontend
cd "$DATALENS_DIR/frontend"
npm install
npm run build

# Backend
cd "$DATALENS_DIR/backend"
pip install -r /opt/datalens-customizations/backend/requirements.txt

# Применить миграции БД
psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/001_user_management.sql
psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/002_rbac.sql
psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/003_versioning.sql
```

#### Перезапустить сервисы

```bash
# Systemd
sudo systemctl restart datalens-frontend datalens-backend

# Или Docker
docker-compose restart frontend backend
# Или
docker restart datalens-frontend datalens-backend
```

## Проверка

```bash
# Проверить API
curl http://localhost:8080/api/v1/file-upload/health

# Проверить логи
tail -f "$DATALENS_DIR/logs/frontend.log"
tail -f "$DATALENS_DIR/logs/backend.log"

# Открыть в браузере
# http://bi.aeronavigator.ru
```

## Дополнительная информация

Для подробных инструкций см.:
- `SERVER_SETUP.md` - подробная инструкция по настройке
- `INTEGRATION_GUIDE.md` - руководство по интеграции
- `DEPLOYMENT.md` - руководство по деплою

