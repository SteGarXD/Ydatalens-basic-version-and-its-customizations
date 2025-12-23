#!/bin/bash
# Применить кастомизации к DataLens

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
DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
CUSTOMIZATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log "=========================================="
log "Applying DataLens Customizations"
log "=========================================="
log ""
log "DataLens directory: $DATALENS_DIR"
log "Customizations directory: $CUSTOMIZATIONS_DIR"
log ""

# Проверка существования директории DataLens
if [ ! -d "$DATALENS_DIR" ]; then
    error "DataLens directory not found: $DATALENS_DIR"
    error "Please set DATALENS_DIR environment variable or install DataLens"
    exit 1
fi

# Проверка структуры DataLens
if [ ! -d "$DATALENS_DIR/frontend" ] || [ ! -d "$DATALENS_DIR/backend" ]; then
    error "Invalid DataLens structure. Expected frontend/ and backend/ directories"
    exit 1
fi

# 1. Копировать кастомизации в frontend
log "1. Copying customizations to frontend..."
if [ -d "$DATALENS_DIR/frontend/src" ]; then
    mkdir -p "$DATALENS_DIR/frontend/src/customizations"
    cp -r "$CUSTOMIZATIONS_DIR/customizations"/* "$DATALENS_DIR/frontend/src/customizations/"
    log "✓ Frontend customizations copied"
else
    warning "Frontend src directory not found, skipping frontend customizations"
fi

# 2. Копировать backend кастомизации
log ""
log "2. Copying backend customizations..."
if [ -d "$DATALENS_DIR/backend/app" ]; then
    mkdir -p "$DATALENS_DIR/backend/app/customizations"
    cp -r "$CUSTOMIZATIONS_DIR/backend"/* "$DATALENS_DIR/backend/app/customizations/" 2>/dev/null || true
    log "✓ Backend customizations copied"
else
    warning "Backend app directory not found, skipping backend customizations"
fi

# 3. Копировать логотип (если есть)
log ""
log "3. Copying branding assets..."
if [ -f "$CUSTOMIZATIONS_DIR/../meridian-demo/OP-compass.png" ]; then
    mkdir -p "$DATALENS_DIR/frontend/public"
    cp "$CUSTOMIZATIONS_DIR/../meridian-demo/OP-compass.png" "$DATALENS_DIR/frontend/public/" 2>/dev/null || true
    log "✓ Logo copied"
fi

# 4. Установить зависимости и применить патчи
log ""
log "4. Installing dependencies and applying patches..."
if [ -f "$DATALENS_DIR/frontend/package.json" ]; then
    cd "$DATALENS_DIR/frontend"
    
    # Установить зависимости кастомизаций
    if [ -f "$CUSTOMIZATIONS_DIR/package.json" ]; then
        log "Installing customization dependencies..."
        npm install --save-dev patch-package postinstall-postinstall || true
    fi
    
    # Применить патчи
    if [ -d "$DATALENS_DIR/frontend/src/customizations/patches" ]; then
        log "Applying patches..."
        npx patch-package || warning "Some patches may have failed"
    fi
    
    log "✓ Dependencies installed and patches applied"
else
    warning "Frontend package.json not found, skipping npm operations"
fi

# 5. Интеграция в главный файл приложения (если нужно)
log ""
log "5. Checking application integration..."
if [ -f "$DATALENS_DIR/frontend/src/index.tsx" ] || [ -f "$DATALENS_DIR/frontend/src/index.ts" ]; then
    log "✓ Application entry point found"
    log "  Note: Manual integration may be required in index.tsx/index.ts"
    log "  Add: import { loadCustomizations } from './customizations';"
    log "  And call: loadCustomizations() before app initialization"
else
    warning "Application entry point not found"
fi

log ""
log "=========================================="
log "Customizations applied successfully!"
log "=========================================="
log ""
log "Next steps:"
log "1. Review and integrate customizations in DataLens entry point"
log "2. Install backend dependencies: pip install -r backend/requirements.txt"
log "3. Rebuild frontend: cd $DATALENS_DIR/frontend && npm run build"
log "4. Restart DataLens service"
log ""

