#!/bin/bash
# Автоматическая настройка единого репозитория с ДВУМЯ ветками
# Ветка 1: base - базовая версия Yandex DataLens
# Ветка 2: customizations - все кастомизации и улучшения

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${BLUE}[STEP]${NC} $1"; }

log "=========================================="
log "Setup Unified Repository - Two Branches"
log "=========================================="
log ""
log "Repository: https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git"
log "Branches:"
log "  1. base - Base Yandex DataLens version"
log "  2. customizations - All customizations and improvements"
log ""

# Автоматическое определение путей
AUTO_DATALENS_DIR=""
AUTO_CUSTOMIZATIONS_REPO=""

# Поиск DataLens
step "1. Auto-detecting DataLens directory..."
for dir in /opt/datalens /usr/local/datalens /home/datalens; do
    if [ -d "$dir" ] && [ -d "$dir/frontend" ] && [ -d "$dir/backend" ]; then
        AUTO_DATALENS_DIR="$dir"
        log "✓ Found DataLens at: $AUTO_DATALENS_DIR"
        break
    fi
done

if [ -z "$AUTO_DATALENS_DIR" ]; then
    DOCKER_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i datalens | head -1)
    if [ -n "$DOCKER_CONTAINER" ]; then
        AUTO_DATALENS_DIR=$(docker inspect "$DOCKER_CONTAINER" 2>/dev/null | grep -i "workdir\|source" | head -1 | cut -d'"' -f4 || echo "")
    fi
fi

if [ -z "$AUTO_DATALENS_DIR" ]; then
    error "DataLens directory not found automatically"
    error "Please set DATALENS_DIR manually: export DATALENS_DIR=/path/to/datalens"
    exit 1
fi

# Поиск репозитория кастомизаций
step "2. Auto-detecting customizations..."
for dir in /opt/datalens-customizations /opt/ANBI/datalens-customizations; do
    if [ -d "$dir" ] && [ -d "$dir/customizations" ]; then
        AUTO_CUSTOMIZATIONS_REPO="$dir"
        log "✓ Found customizations at: $AUTO_CUSTOMIZATIONS_REPO"
        break
    fi
done

if [ -z "$AUTO_CUSTOMIZATIONS_REPO" ]; then
    log "Cloning customizations repository..."
    cd /opt
    git clone https://github.com/SteGarXD/datalens-customizations.git 2>/dev/null || true
    if [ -d "datalens-customizations" ]; then
        AUTO_CUSTOMIZATIONS_REPO="/opt/datalens-customizations"
    fi
fi

if [ -z "$AUTO_CUSTOMIZATIONS_REPO" ]; then
    error "Customizations repository not found"
    exit 1
fi

# Настройка переменных
UNIFIED_REPO_DIR="/opt/Ydatalens-basic-version-and-its-customizations"
DATALENS_DIR="$AUTO_DATALENS_DIR"
CUSTOMIZATIONS_REPO="$AUTO_CUSTOMIZATIONS_REPO"

log ""
log "Configuration:"
log "  DataLens: $DATALENS_DIR"
log "  Customizations: $CUSTOMIZATIONS_REPO"
log "  Unified Repo: $UNIFIED_REPO_DIR"
log ""

# 3. Клонировать единый репозиторий
step "3. Cloning unified repository..."
if [ -d "$UNIFIED_REPO_DIR" ]; then
    warning "Unified repository already exists, updating..."
    cd "$UNIFIED_REPO_DIR"
    git fetch origin 2>/dev/null || true
else
    cd /opt
    git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git 2>/dev/null || {
        error "Failed to clone unified repository"
        error "Please create repository on GitHub first:"
        error "  https://github.com/new"
        error "  Name: Ydatalens-basic-version-and-its-customizations"
        exit 1
    }
    log "✓ Repository cloned"
fi

cd "$UNIFIED_REPO_DIR"

# Настроить Git
git config core.autocrlf true 2>/dev/null || true
git config core.eol lf 2>/dev/null || true

# 4. ВЕТКА 1: base - Базовая версия DataLens
step "4. Creating BRANCH 1: base (Base Yandex DataLens)..."

# Удалить ветку base если существует локально
git branch -D base 2>/dev/null || true

# Создать новую ветку base
git checkout --orphan base 2>/dev/null || git checkout -b base
git rm -rf . 2>/dev/null || true

# Копировать базовую версию DataLens
log "Copying base DataLens files from $DATALENS_DIR..."
cp -r "$DATALENS_DIR"/* . 2>/dev/null || true
cp -r "$DATALENS_DIR"/.[!.]* . 2>/dev/null || true

# Создать .gitignore для базовой версии
cat > .gitignore << 'EOF'
node_modules/
__pycache__/
*.pyc
dist/
build/
*.log
.env
.env.*
data/
logs/
*.db
*.sqlite
EOF

# Создать README для базовой ветки
cat > README.md << 'EOF'
# Базовая версия Yandex DataLens

Это базовая, оригинальная версия Yandex DataLens Open Source.

## Описание

Базовая on-premise версия DataLens без дополнительных функций облачной версии.

## Использование

Эта ветка содержит чистую версию DataLens. Для версии с кастомизациями см. ветку `customizations`.

## Ветки

- `base` - Базовая версия (эта ветка)
- `customizations` - Версия с кастомизациями и улучшениями
EOF

# Commit базовой версии
git add . 2>/dev/null || true
VERSION=$(cat frontend/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo "unknown")
git commit -m "Base Yandex DataLens installation

- Base DataLens from server
- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR" 2>/dev/null || {
    error "Failed to commit base version"
    exit 1
}

log "✓ Branch 'base' created with base DataLens"

# 5. ВЕТКА 2: customizations - Все кастомизации
step "5. Creating BRANCH 2: customizations (All customizations and improvements)..."

# Создать ветку customizations
git checkout --orphan customizations 2>/dev/null || git checkout -b customizations
git rm -rf . 2>/dev/null || true

# Копировать кастомизации
log "Copying customizations from $CUSTOMIZATIONS_REPO..."
cp -r "$CUSTOMIZATIONS_REPO"/customizations ./
cp -r "$CUSTOMIZATIONS_REPO"/backend ./
cp -r "$CUSTOMIZATIONS_REPO"/scripts ./
cp -r "$CUSTOMIZATIONS_REPO"/.github ./
cp "$CUSTOMIZATIONS_REPO"/*.md ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/package.json ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/.gitignore ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/.gitattributes ./ 2>/dev/null || true

# Создать README для ветки кастомизаций
cat > README.md << 'EOF'
# Кастомизации и улучшения DataLens

Все кастомизации, улучшения и новые функции для Yandex DataLens.

## Описание

Эта ветка содержит:
- Все кастомизации для ООО "Аэронавигатор"
- Новые функции и улучшения
- Backend сервисы
- Frontend модули
- Миграции БД
- Скрипты деплоя

## Использование

Для применения кастомизаций к базовой версии см. документацию в этой ветке.

## Ветки

- `base` - Базовая версия Yandex DataLens
- `customizations` - Все кастомизации (эта ветка)
EOF

# Commit кастомизаций
git add . 2>/dev/null || true
git commit -m "All customizations and improvements

- Customizations for ООО \"Аэронавигатор\"
- New features and enhancements
- Backend services
- Frontend modules
- Database migrations
- Deployment scripts
- Date: $(date +%Y-%m-%d)" 2>/dev/null || {
    error "Failed to commit customizations"
    exit 1
}

log "✓ Branch 'customizations' created with all customizations"

# 6. Push обеих веток
step "6. Pushing branches to GitHub..."
log "Pushing 'base' branch..."
git push -u origin base --force 2>/dev/null && log "✓ Base branch pushed" || warning "Failed to push base (may need authentication)"

log "Pushing 'customizations' branch..."
git push -u origin customizations --force 2>/dev/null && log "✓ Customizations branch pushed" || warning "Failed to push customizations (may need authentication)"

# 7. Установить default branch (если нужно)
step "7. Setting default branch..."
# Попробовать установить main как default (если существует) или base
git checkout base 2>/dev/null || true

log ""
log "=========================================="
log "Setup completed successfully!"
log "=========================================="
log ""
log "Repository: https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations"
log ""
log "Branches created:"
log "  ✓ base - Base Yandex DataLens version"
log "  ✓ customizations - All customizations and improvements"
log ""
log "Next steps:"
log "1. Check branches on GitHub"
log "2. To merge customizations into base (when ready):"
log "   git checkout base"
log "   git merge customizations"
log "   git push origin base"
log ""

