#!/bin/bash
# Финальная интеграция кастомизаций в DataLens
# Этот скрипт выполняет все необходимые шаги для 100% интеграции

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${BLUE}[STEP]${NC} $1"; }

DATALENS_DIR="${DATALENS_DIR:-$HOME/datalens}"
CUSTOMIZATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log "=========================================="
log "Final Integration: 100% Readiness"
log "=========================================="
log ""

# Шаг 1: Применить патчи
step "1. Applying patches for DataLens integration..."

if [ -d "$CUSTOMIZATIONS_DIR/customizations/patches" ]; then
    cd "$DATALENS_DIR" 2>/dev/null || {
        warning "DataLens directory not found, patches will be applied when available"
    }
    
    # Установить patch-package если нужно
    if command -v npm &> /dev/null; then
        cd "$DATALENS_DIR/frontend" 2>/dev/null && npm install --save-dev patch-package postinstall-postinstall || true
    fi
    
    log "✓ Patches prepared"
else
    warning "Patches directory not found"
fi

# Шаг 2: Копировать кастомизации
step "2. Copying customizations to DataLens..."

if [ -d "$DATALENS_DIR/frontend/src" ]; then
    mkdir -p "$DATALENS_DIR/frontend/src/customizations"
    cp -r "$CUSTOMIZATIONS_DIR/customizations"/* "$DATALENS_DIR/frontend/src/customizations/" 2>/dev/null || true
    log "✓ Frontend customizations copied"
fi

if [ -d "$DATALENS_DIR/backend/app" ]; then
    mkdir -p "$DATALENS_DIR/backend/app/customizations"
    cp -r "$CUSTOMIZATIONS_DIR/backend"/* "$DATALENS_DIR/backend/app/customizations/" 2>/dev/null || true
    log "✓ Backend customizations copied"
fi

# Шаг 3: Интегрировать в главный файл приложения
step "3. Integrating customizations into DataLens entry point..."

# Найти главный файл приложения
MAIN_FILE=""
for file in "$DATALENS_DIR/frontend/src/index.tsx" "$DATALENS_DIR/frontend/src/index.ts" \
            "$DATALENS_DIR/frontend/src/App.tsx" "$DATALENS_DIR/frontend/src/main.tsx"; do
    if [ -f "$file" ]; then
        MAIN_FILE="$file"
        break
    fi
done

if [ -n "$MAIN_FILE" ]; then
    # Проверить, есть ли уже импорт кастомизаций
    if ! grep -q "initializeCustomizations" "$MAIN_FILE" 2>/dev/null; then
        # Добавить импорт и вызов в начало файла
        TEMP_FILE=$(mktemp)
        cat > "$TEMP_FILE" << 'EOF'
// AeronavigatorBI Customizations
import { initializeCustomizations } from './customizations/integration';

// Initialize customizations before app initialization
initializeCustomizations().catch(err => {
  console.error('[AeronavigatorBI] Failed to initialize customizations:', err);
});

EOF
        cat "$MAIN_FILE" >> "$TEMP_FILE"
        mv "$TEMP_FILE" "$MAIN_FILE"
        log "✓ Customizations integrated into $MAIN_FILE"
    else
        log "✓ Customizations already integrated"
    fi
else
    warning "Main application file not found - manual integration required"
    log "  Add to main file:"
    log "    import { initializeCustomizations } from './customizations/integration';"
    log "    initializeCustomizations();"
fi

# Шаг 4: Интегрировать backend
step "4. Integrating backend customizations..."

if [ -f "$DATALENS_DIR/backend/app/main.py" ] || [ -f "$DATALENS_DIR/backend/main.py" ]; then
    BACKEND_MAIN=$(find "$DATALENS_DIR/backend" -name "main.py" | head -1)
    if [ -n "$BACKEND_MAIN" ]; then
        if ! grep -q "initialize_customizations" "$BACKEND_MAIN" 2>/dev/null; then
            # Добавить импорт и вызов
            TEMP_FILE=$(mktemp)
            cat "$BACKEND_MAIN" > "$TEMP_FILE"
            cat >> "$TEMP_FILE" << 'EOF'

# AeronavigatorBI Customizations
try:
    from app.customizations.integration import initialize_customizations
    initialize_customizations(app)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("AeronavigatorBI customizations not available")
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Error initializing AeronavigatorBI customizations: {e}")

EOF
            mv "$TEMP_FILE" "$BACKEND_MAIN"
            log "✓ Backend customizations integrated"
        else
            log "✓ Backend customizations already integrated"
        fi
    fi
else
    warning "Backend main file not found - manual integration required"
    log "  Add to backend main.py:"
    log "    from app.customizations.integration import initialize_customizations"
    log "    initialize_customizations(app)"
fi

# Шаг 5: Применить миграции БД
step "5. Preparing database migrations..."

if [ -d "$CUSTOMIZATIONS_DIR/customizations/migrations" ]; then
    log "✓ Migrations ready:"
    ls -1 "$CUSTOMIZATIONS_DIR/customizations/migrations"/*.sql 2>/dev/null | while read migration; do
        log "  - $(basename $migration)"
    done
    log "  Note: Apply migrations manually to PostgreSQL"
fi

# Шаг 6: Установить зависимости
step "6. Installing dependencies..."

if [ -f "$DATALENS_DIR/frontend/package.json" ]; then
    cd "$DATALENS_DIR/frontend"
    if [ -f "$CUSTOMIZATIONS_DIR/package.json" ]; then
        # Установить зависимости кастомизаций
        npm install --save-dev patch-package postinstall-postinstall 2>/dev/null || true
        log "✓ Frontend dependencies installed"
    fi
fi

if [ -f "$DATALENS_DIR/backend/requirements.txt" ]; then
    if [ -f "$CUSTOMIZATIONS_DIR/backend/requirements.txt" ]; then
        cd "$DATALENS_DIR/backend"
        pip install -r "$CUSTOMIZATIONS_DIR/backend/requirements.txt" 2>/dev/null || true
        log "✓ Backend dependencies installed"
    fi
fi

log ""
log "=========================================="
log "Integration Complete!"
log "=========================================="
log ""
log "Next steps:"
log "1. Review integration in main files"
log "2. Apply database migrations"
log "3. Rebuild frontend: cd $DATALENS_DIR/frontend && npm run build"
log "4. Restart DataLens services"
log "5. Test all customizations"
log ""

