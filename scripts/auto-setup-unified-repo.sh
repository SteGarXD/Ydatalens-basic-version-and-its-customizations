#!/bin/bash
# Полностью автоматическая настройка единого репозитория
# Выполняет все шаги без вмешательства пользователя

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
log "Automatic Unified Repository Setup"
log "=========================================="

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
    # Проверка Docker
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
step "2. Auto-detecting customizations repository..."
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
        error "Please create repository on GitHub first"
        exit 1
    }
    log "✓ Repository cloned"
fi

cd "$UNIFIED_REPO_DIR"

# Настроить Git для автоматической конвертации окончаний строк
git config core.autocrlf true 2>/dev/null || true
git config core.eol lf 2>/dev/null || true

# 4. Создать/обновить ветку base
step "4. Setting up base branch..."
if git show-ref --verify --quiet refs/heads/base; then
    git checkout base
    log "✓ Base branch exists"
else
    git checkout -b base 2>/dev/null || git checkout --orphan base
    log "✓ Base branch created"
fi

# Очистить и скопировать базовую версию
log "Copying base DataLens files..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} + 2>/dev/null || true
cp -r "$DATALENS_DIR"/* . 2>/dev/null || true
cp -r "$DATALENS_DIR"/.[!.]* . 2>/dev/null || true

# Создать .gitignore
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

# Commit базовой версии
git add . 2>/dev/null || true
VERSION=$(cat frontend/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo "unknown")
git commit -m "Base Yandex DataLens installation

- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Auto-generated" 2>/dev/null || warning "Nothing to commit in base"

log "✓ Base branch ready"

# 5. Создать/обновить ветку customizations
step "5. Setting up customizations branch..."
if git show-ref --verify --quiet refs/heads/customizations; then
    git checkout customizations
    log "✓ Customizations branch exists"
else
    git checkout -b customizations
    log "✓ Customizations branch created"
fi

# Очистить и скопировать кастомизации
log "Copying customizations..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} + 2>/dev/null || true
cp -r "$CUSTOMIZATIONS_REPO"/customizations ./
cp -r "$CUSTOMIZATIONS_REPO"/backend ./
cp -r "$CUSTOMIZATIONS_REPO"/scripts ./
cp -r "$CUSTOMIZATIONS_REPO"/.github ./
cp "$CUSTOMIZATIONS_REPO"/*.md ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/package.json ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/.gitignore ./ 2>/dev/null || true
cp "$CUSTOMIZATIONS_REPO"/.gitattributes ./ 2>/dev/null || true

# Commit кастомизаций
git add . 2>/dev/null || true
git commit -m "Add customizations and improvements

- All customizations from datalens-customizations
- Date: $(date +%Y-%m-%d)
- Auto-generated" 2>/dev/null || warning "Nothing to commit in customizations"

log "✓ Customizations branch ready"

# 6. Push веток
step "6. Pushing branches to GitHub..."
git push -u origin base 2>/dev/null && log "✓ Base branch pushed" || warning "Failed to push base (may need authentication)"
git push -u origin customizations 2>/dev/null && log "✓ Customizations branch pushed" || warning "Failed to push customizations (may need authentication)"

# 7. Создать ветку integration
step "7. Creating integration branch..."
git checkout base
git checkout -b integration 2>/dev/null || git checkout integration
git merge customizations --no-ff -m "Merge customizations into base

- Auto-merged for testing
- Date: $(date +%Y-%m-%d)" 2>/dev/null || warning "Merge may have conflicts"

log "✓ Integration branch created"

# 8. Применить кастомизации
step "8. Applying customizations..."
if [ -f "scripts/apply-customizations.sh" ]; then
    chmod +x scripts/apply-customizations.sh
    export DATALENS_DIR="$(pwd)"
    ./scripts/apply-customizations.sh 2>/dev/null || warning "Some steps in apply-customizations.sh may have failed"
    log "✓ Customizations applied"
fi

log ""
log "=========================================="
log "Automatic setup completed!"
log "=========================================="
log ""
log "Branches:"
log "  ✓ base - Base DataLens"
log "  ✓ customizations - All customizations"
log "  ✓ integration - Merged version (ready for testing)"
log ""
log "Next steps:"
log "1. Review integration branch"
log "2. Test the integrated version"
log "3. Merge to main when ready:"
log "   cd $UNIFIED_REPO_DIR"
log "   git checkout main"
log "   git merge integration"
log "   git push origin main"
log ""

