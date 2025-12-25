#!/bin/bash
# Полная автоматическая интеграция и развертывание на сервере
# Выполняет все необходимые шаги для интеграции кастомизаций в DataLens

set -e

echo "🚀 Автоматическое развертывание AeronavigatorBI кастомизаций"
echo "============================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функции для вывода
log() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Определение директорий
CUSTOMIZATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
HOME_DIR="${HOME:-~}"

# Если DataLens в домашней директории
if [ -d "$HOME_DIR/datalens" ]; then
    DATALENS_DIR="$HOME_DIR/datalens"
fi

log "Директория кастомизаций: $CUSTOMIZATIONS_DIR"
log "Директория DataLens: $DATALENS_DIR"

# Шаг 1: Обновление кода
echo ""
echo "📦 Шаг 1: Обновление кода из Git..."
cd "$CUSTOMIZATIONS_DIR"
if [ -d ".git" ]; then
    git checkout customizations 2>/dev/null || true
    git pull origin customizations || warn "Не удалось обновить из Git (возможно, уже актуально)"
    log "Код обновлен"
else
    warn "Не найден Git репозиторий, пропускаем обновление"
fi

# Шаг 2: Установка зависимостей
echo ""
echo "📦 Шаг 2: Установка зависимостей..."

# Backend зависимости
if [ -f "$CUSTOMIZATIONS_DIR/backend/requirements.txt" ]; then
    log "Установка Python зависимостей..."
    if command -v pip3 &> /dev/null; then
        pip3 install -r "$CUSTOMIZATIONS_DIR/backend/requirements.txt" || warn "Некоторые зависимости не установились"
    elif command -v pip &> /dev/null; then
        pip install -r "$CUSTOMIZATIONS_DIR/backend/requirements.txt" || warn "Некоторые зависимости не установились"
    else
        warn "pip не найден, пропускаем установку Python зависимостей"
    fi
fi

# Frontend зависимости (если нужно)
if [ -f "$CUSTOMIZATIONS_DIR/package.json" ]; then
    log "Проверка Node.js зависимостей..."
    if command -v npm &> /dev/null; then
        cd "$CUSTOMIZATIONS_DIR"
        npm install --production 2>/dev/null || warn "npm install не удался (возможно, не критично)"
    else
        warn "npm не найден, пропускаем установку Node.js зависимостей"
    fi
fi

# Шаг 3: Интеграция в DataLens
echo ""
echo "📦 Шаг 3: Интеграция кастомизаций в DataLens..."

# Поиск главного файла frontend
FRONTEND_MAIN=""
for file in "$DATALENS_DIR/frontend/src/index.tsx" "$DATALENS_DIR/frontend/src/index.ts" \
            "$DATALENS_DIR/frontend/src/App.tsx" "$DATALENS_DIR/frontend/src/main.tsx" \
            "$DATALENS_DIR/src/index.tsx" "$DATALENS_DIR/src/index.ts"; do
    if [ -f "$file" ]; then
        FRONTEND_MAIN="$file"
        break
    fi
done

# Интеграция frontend
if [ -n "$FRONTEND_MAIN" ]; then
    log "Найден frontend файл: $FRONTEND_MAIN"
    
    if ! grep -q "initializeCustomizations" "$FRONTEND_MAIN" 2>/dev/null; then
        MAIN_DIR=$(dirname "$FRONTEND_MAIN")
        RELATIVE_PATH=$(realpath --relative-to="$MAIN_DIR" "$CUSTOMIZATIONS_DIR/customizations" 2>/dev/null || echo "customizations")
        
        # Создать резервную копию
        cp "$FRONTEND_MAIN" "${FRONTEND_MAIN}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Добавить импорт и вызов
        TEMP_FILE=$(mktemp)
        cat > "$TEMP_FILE" << EOF
// AeronavigatorBI Customizations - Auto-integrated $(date)
import { initializeCustomizations } from './${RELATIVE_PATH}/integration';

// Initialize customizations before app initialization
initializeCustomizations().catch(err => {
  console.error('[AeronavigatorBI] Failed to initialize customizations:', err);
});

EOF
        cat "$FRONTEND_MAIN" >> "$TEMP_FILE"
        mv "$TEMP_FILE" "$FRONTEND_MAIN"
        log "Frontend интеграция выполнена"
    else
        log "Frontend уже интегрирован"
    fi
else
    warn "Frontend файл не найден (возможно, в Docker контейнере)"
fi

# Поиск главного файла backend
BACKEND_MAIN=""
for file in "$DATALENS_DIR/backend/app/main.py" "$DATALENS_DIR/backend/main.py" \
            "$DATALENS_DIR/app/main.py" "$DATALENS_DIR/main.py"; do
    if [ -f "$file" ]; then
        BACKEND_MAIN="$file"
        break
    fi
done

# Интеграция backend
if [ -n "$BACKEND_MAIN" ]; then
    log "Найден backend файл: $BACKEND_MAIN"
    
    if ! grep -q "initialize_customizations" "$BACKEND_MAIN" 2>/dev/null; then
        MAIN_DIR=$(dirname "$BACKEND_MAIN")
        RELATIVE_PATH=$(realpath --relative-to="$MAIN_DIR" "$CUSTOMIZATIONS_DIR/backend" 2>/dev/null || echo "../customizations/backend")
        PYTHON_PATH=$(echo "$RELATIVE_PATH" | sed 's/\//./g' | sed 's/^\.\.\.//' | sed 's/^\.//')
        
        # Создать резервную копию
        cp "$BACKEND_MAIN" "${BACKEND_MAIN}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Добавить импорт
        if grep -q "from fastapi import" "$BACKEND_MAIN"; then
            sed -i "/^from fastapi import/a # AeronavigatorBI Customizations\nfrom ${PYTHON_PATH}.integration import initialize_customizations" "$BACKEND_MAIN"
        else
            # Добавить в начало после других импортов
            sed -i "1a # AeronavigatorBI Customizations\nfrom ${PYTHON_PATH}.integration import initialize_customizations" "$BACKEND_MAIN"
        fi
        
        # Добавить вызов после создания app
        if grep -q "app = FastAPI" "$BACKEND_MAIN"; then
            sed -i "/app = FastAPI/a \n# Initialize AeronavigatorBI customizations\ninitialize_customizations(app)" "$BACKEND_MAIN"
        elif grep -q "@app.on_event" "$BACKEND_MAIN"; then
            sed -i "/@app.on_event/a     initialize_customizations(app)" "$BACKEND_MAIN"
        else
            # Добавить перед if __name__
            sed -i "/if __name__/i # Initialize AeronavigatorBI customizations\ninitialize_customizations(app)\n" "$BACKEND_MAIN"
        fi
        
        log "Backend интеграция выполнена"
    else
        log "Backend уже интегрирован"
    fi
else
    warn "Backend файл не найден (возможно, в Docker контейнере)"
fi

# Шаг 4: Docker интеграция
echo ""
echo "📦 Шаг 4: Настройка Docker интеграции..."

# Поиск docker-compose.yaml
DOCKER_COMPOSE=""
for file in "$DATALENS_DIR/docker-compose.yaml" "$DATALENS_DIR/docker-compose.yml" \
            "$HOME_DIR/datalens/docker-compose.yaml" "$HOME_DIR/datalens/docker-compose.yml" \
            "./docker-compose.yaml" "./docker-compose.yml"; do
    if [ -f "$file" ]; then
        DOCKER_COMPOSE="$file"
        break
    fi
done

if [ -n "$DOCKER_COMPOSE" ]; then
    log "Найден docker-compose: $DOCKER_COMPOSE"
    
    # Проверить, есть ли уже volumes
    if ! grep -q "customizations" "$DOCKER_COMPOSE" 2>/dev/null; then
        # Создать резервную копию
        cp "$DOCKER_COMPOSE" "${DOCKER_COMPOSE}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Добавить volumes (упрощенная версия - нужно вручную проверить)
        log "Необходимо вручную добавить volumes в $DOCKER_COMPOSE:"
        echo "  datalens-ui:"
        echo "    volumes:"
        echo "      - $CUSTOMIZATIONS_DIR/customizations:/app/customizations:ro"
        echo "  datalens-control-api:"
        echo "    volumes:"
        echo "      - $CUSTOMIZATIONS_DIR/backend:/app/customizations/backend:ro"
    else
        log "Volumes уже настроены в docker-compose"
    fi
else
    warn "docker-compose.yaml не найден"
fi

# Шаг 5: Инструкции по перезапуску
echo ""
echo "📦 Шаг 5: Инструкции по перезапуску..."
echo ""
log "Для применения изменений выполните:"
echo ""
echo "  cd $DATALENS_DIR"
echo "  docker-compose down"
echo "  docker-compose build --no-cache"
echo "  docker-compose up -d"
echo ""
echo "  # Проверить логи:"
echo "  docker-compose logs -f datalens-ui | grep AeronavigatorBI"
echo ""

# Шаг 6: Создание патча для patch-package
echo ""
echo "📦 Шаг 6: Создание патчей..."
if [ -f "$CUSTOMIZATIONS_DIR/package.json" ] && grep -q "patch-package" "$CUSTOMIZATIONS_DIR/package.json"; then
    if [ -d "$CUSTOMIZATIONS_DIR/customizations/patches" ]; then
        log "Патчи уже созданы"
    else
        warn "Патчи нужно создать вручную (см. DEPLOYMENT_COMPLETE.md)"
    fi
fi

echo ""
echo "✅ Автоматическое развертывание завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте интеграцию в файлах (см. выше)"
echo "2. Добавьте volumes в docker-compose.yaml (если нужно)"
echo "3. Пересоберите и перезапустите контейнеры"
echo "4. Проверьте логи на наличие '[AeronavigatorBI]' сообщений"
echo ""

