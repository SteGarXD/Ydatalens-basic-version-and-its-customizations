#!/bin/bash
# Интеграция кастомизаций в Docker-based DataLens
# Этот скрипт работает с DataLens, развернутым через Docker Compose

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Определение директорий
DATALENS_DIR="${DATALENS_DIR:-$HOME/datalens}"
CUSTOMIZATIONS_REPO_DIR="${CUSTOMIZATIONS_REPO_DIR:-$HOME/Ydatalens-basic-version-and-its-customizations}"
WORK_DIR="$HOME/datalens-with-customizations"

log "=========================================="
log "Integrating Customizations into Docker DataLens"
log "=========================================="
log ""
log "DataLens directory: $DATALENS_DIR"
log "Customizations repo: $CUSTOMIZATIONS_REPO_DIR"
log "Work directory: $WORK_DIR"
log ""

# Проверка существования директорий
if [ ! -d "$DATALENS_DIR" ]; then
    error "DataLens directory not found: $DATALENS_DIR"
    exit 1
fi

if [ ! -d "$CUSTOMIZATIONS_REPO_DIR" ]; then
    error "Customizations repository not found: $CUSTOMIZATIONS_REPO_DIR"
    exit 1
fi

# Переключиться на ветку customizations
cd "$CUSTOMIZATIONS_REPO_DIR"
git checkout customizations 2>/dev/null || true
git pull origin customizations 2>/dev/null || true

# Создать рабочую директорию
log "Creating work directory..."
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# 1. Клонировать базовую версию DataLens (если еще не клонирована)
if [ ! -d "$WORK_DIR/datalens-base" ]; then
    log "1. Cloning base DataLens repository..."
    git clone https://github.com/datalens-tech/datalens.git datalens-base || {
        error "Failed to clone DataLens repository"
        exit 1
    }
    log "✓ Base DataLens cloned"
else
    log "1. Base DataLens already cloned, updating..."
    cd "$WORK_DIR/datalens-base"
    git pull origin main || git pull origin master || true
    cd "$WORK_DIR"
fi

# 2. Клонировать исходники frontend и backend (если доступны)
# Примечание: Официальные репозитории frontend/backend могут быть приватными
# В этом случае нужно использовать альтернативный подход

log ""
log "2. Checking for frontend/backend source code..."

# Проверка наличия исходников в базовом репозитории
if [ -d "$WORK_DIR/datalens-base/frontend" ] && [ -d "$WORK_DIR/datalens-base/backend" ]; then
    log "✓ Frontend and backend found in base repository"
    FRONTEND_DIR="$WORK_DIR/datalens-base/frontend"
    BACKEND_DIR="$WORK_DIR/datalens-base/backend"
else
    warning "Frontend/backend not found in base repository"
    warning "DataLens uses Docker images - customizations will be applied via volumes"
    
    # Создать структуру для volumes
    mkdir -p "$WORK_DIR/customizations/frontend"
    mkdir -p "$WORK_DIR/customizations/backend"
    
    FRONTEND_DIR="$WORK_DIR/customizations/frontend"
    BACKEND_DIR="$WORK_DIR/customizations/backend"
fi

# 3. Копировать кастомизации
log ""
log "3. Copying customizations..."

if [ -d "$FRONTEND_DIR/src" ]; then
    log "Copying frontend customizations..."
    mkdir -p "$FRONTEND_DIR/src/customizations"
    cp -r "$CUSTOMIZATIONS_REPO_DIR/customizations"/* "$FRONTEND_DIR/src/customizations/" 2>/dev/null || true
    log "✓ Frontend customizations copied"
else
    # Создать структуру для монтирования в Docker
    log "Creating frontend customization structure for Docker volumes..."
    mkdir -p "$WORK_DIR/customizations/frontend/src/customizations"
    cp -r "$CUSTOMIZATIONS_REPO_DIR/customizations"/* "$WORK_DIR/customizations/frontend/src/customizations/"
    log "✓ Frontend customizations prepared for Docker volumes"
fi

if [ -d "$BACKEND_DIR/app" ] || [ -d "$BACKEND_DIR" ]; then
    log "Copying backend customizations..."
    mkdir -p "$BACKEND_DIR/app/customizations" 2>/dev/null || mkdir -p "$BACKEND_DIR/customizations"
    cp -r "$CUSTOMIZATIONS_REPO_DIR/backend"/* "$BACKEND_DIR/app/customizations/" 2>/dev/null || \
    cp -r "$CUSTOMIZATIONS_REPO_DIR/backend"/* "$BACKEND_DIR/customizations/" 2>/dev/null || true
    log "✓ Backend customizations copied"
else
    log "Creating backend customization structure for Docker volumes..."
    mkdir -p "$WORK_DIR/customizations/backend/app/customizations"
    cp -r "$CUSTOMIZATIONS_REPO_DIR/backend"/* "$WORK_DIR/customizations/backend/app/customizations/"
    log "✓ Backend customizations prepared for Docker volumes"
fi

# 4. Копировать конфигурацию Docker Compose
log ""
log "4. Preparing Docker Compose configuration..."

if [ -f "$DATALENS_DIR/docker-compose.yaml" ]; then
    cp "$DATALENS_DIR/docker-compose.yaml" "$WORK_DIR/docker-compose.customized.yaml"
    
    # Добавить volumes для кастомизаций (если нужно)
    log "✓ Docker Compose configuration copied"
    log "  Note: You may need to manually add volumes for customizations"
else
    warning "docker-compose.yaml not found in DataLens directory"
fi

# 5. Создать инструкции по интеграции
log ""
log "5. Creating integration instructions..."

cat > "$WORK_DIR/INTEGRATION_INSTRUCTIONS.md" << 'EOF'
# Инструкции по интеграции кастомизаций

## Вариант 1: Использование Docker Volumes

Добавьте в docker-compose.yaml volumes для монтирования кастомизаций:

```yaml
services:
  datalens-ui:
    volumes:
      - ./customizations/frontend/src/customizations:/app/src/customizations:ro
      # или полный путь: $HOME/datalens-with-customizations/customizations/frontend/src/customizations
```

## Вариант 2: Пересборка образов

Если у вас есть доступ к исходникам frontend/backend:

1. Применить кастомизации в исходники
2. Пересобрать Docker образы:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

## Вариант 3: Копирование в работающие контейнеры

```bash
# Копировать кастомизации в контейнер
docker cp customizations/frontend/src/customizations datalens-ui:/app/src/
docker restart datalens-ui
```

## Следующие шаги

1. Интегрировать загрузку кастомизаций в главный файл приложения
2. Применить миграции БД
3. Перезапустить сервисы
EOF

log "✓ Integration instructions created"

log ""
log "=========================================="
log "Customizations prepared for integration!"
log "=========================================="
log ""
log "Work directory: $WORK_DIR"
log ""
log "Next steps:"
log "1. Review INTEGRATION_INSTRUCTIONS.md"
log "2. Choose integration method (volumes/build/copy)"
log "3. Apply customizations to running DataLens"
log "4. Test functionality"
log ""

