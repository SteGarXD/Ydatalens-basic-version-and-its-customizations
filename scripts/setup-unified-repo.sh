#!/bin/bash
# Скрипт для настройки единого репозитория с двумя ветками
# Используется на сервере для подготовки структуры

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log "=========================================="
log "Setup Unified Repository"
log "=========================================="
log ""

# Определение директорий
UNIFIED_REPO_DIR="${UNIFIED_REPO_DIR:-/opt/Ydatalens-basic-version-and-its-customizations}"
DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
CUSTOMIZATIONS_REPO="${CUSTOMIZATIONS_REPO:-/opt/datalens-customizations}"

log "Unified repository: $UNIFIED_REPO_DIR"
log "DataLens directory: $DATALENS_DIR"
log "Customizations repo: $CUSTOMIZATIONS_REPO"
log ""

# 1. Клонировать единый репозиторий
step "1. Cloning unified repository..."
if [ ! -d "$UNIFIED_REPO_DIR" ]; then
    cd /opt
    git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
    log "✓ Repository cloned"
else
    log "✓ Repository already exists"
fi

cd "$UNIFIED_REPO_DIR"

# 2. Создать ветку base
step "2. Creating base branch..."
if git show-ref --verify --quiet refs/heads/base; then
    warning "Base branch already exists"
    git checkout base
else
    git checkout -b base 2>/dev/null || git checkout --orphan base
    log "✓ Base branch created"
fi

# 3. Копировать базовую версию DataLens
step "3. Copying base DataLens..."
if [ ! -d "$DATALENS_DIR" ]; then
    error "DataLens directory not found: $DATALENS_DIR"
    error "Please set DATALENS_DIR environment variable"
    exit 1
fi

# Очистить текущую директорию (кроме .git)
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Копировать файлы DataLens
log "Copying files from $DATALENS_DIR..."
cp -r "$DATALENS_DIR"/* . 2>/dev/null || true
cp -r "$DATALENS_DIR"/.[!.]* . 2>/dev/null || true

# Создать .gitignore если его нет
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd

# Build outputs
dist/
build/
*.log

# Environment
.env
.env.local
.env.*.local

# DataLens specific
data/
logs/
*.db
*.sqlite
EOF
    log "✓ .gitignore created"
fi

# 4. Создать commit для базовой версии
step "4. Committing base version..."
git add .
VERSION=$(cat frontend/package.json 2>/dev/null | grep version | head -1 | cut -d'"' -f4 || echo "unknown")
git commit -m "Base Yandex DataLens installation

- Base DataLens from server
- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR" || {
    warning "Nothing to commit or commit failed"
}

log "✓ Base version committed"

# 5. Создать ветку customizations
step "5. Creating customizations branch..."
if git show-ref --verify --quiet refs/heads/customizations; then
    warning "Customizations branch already exists"
    git checkout customizations
else
    git checkout -b customizations
    log "✓ Customizations branch created"
fi

# 6. Копировать кастомизации
step "6. Copying customizations..."
if [ ! -d "$CUSTOMIZATIONS_REPO" ]; then
    warning "Customizations repository not found, cloning..."
    cd /opt
    git clone https://github.com/SteGarXD/datalens-customizations.git
    cd "$UNIFIED_REPO_DIR"
fi

# Очистить текущую директорию (кроме .git)
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Копировать кастомизации
log "Copying customizations from $CUSTOMIZATIONS_REPO..."
cp -r "$CUSTOMIZATIONS_REPO"/customizations ./
cp -r "$CUSTOMIZATIONS_REPO"/backend ./
cp -r "$CUSTOMIZATIONS_REPO"/scripts ./
cp -r "$CUSTOMIZATIONS_REPO"/.github ./
cp "$CUSTOMIZATIONS_REPO"/*.md ./
cp "$CUSTOMIZATIONS_REPO"/package.json ./
cp "$CUSTOMIZATIONS_REPO"/.gitignore ./
cp "$CUSTOMIZATIONS_REPO"/.gitattributes ./

# 7. Создать commit для кастомизаций
step "7. Committing customizations..."
git add .
git commit -m "Add customizations and improvements

- All customizations from datalens-customizations repository
- Frontend modules
- Backend services
- Database migrations
- Scripts and documentation
- Date: $(date +%Y-%m-%d)" || {
    warning "Nothing to commit or commit failed"
}

log "✓ Customizations committed"

# 8. Push веток
step "8. Pushing branches..."
log "Pushing base branch..."
git push -u origin base || warning "Failed to push base branch"

log "Pushing customizations branch..."
git push -u origin customizations || warning "Failed to push customizations branch"

log ""
log "=========================================="
log "Unified repository setup completed!"
log "=========================================="
log ""
log "Branches created:"
log "  - base: Base Yandex DataLens installation"
log "  - customizations: All customizations and improvements"
log ""
log "Next steps:"
log "1. Review branches on GitHub"
log "2. Create integration branch: git checkout base && git checkout -b integration"
log "3. Merge customizations: git merge customizations"
log "4. Apply customizations using scripts/apply-customizations.sh"
log "5. Test integration"
log "6. Merge to main when ready"
log ""

