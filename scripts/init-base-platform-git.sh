#!/bin/bash
# Инициализация Git репозитория для базовой платформы DataLens на сервере
# Этот скрипт выполняется на сервере bi.aeronavigator.ru

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
log "Initialize Git Repository for DataLens Base Platform"
log "=========================================="
log ""

# Определение директории DataLens
DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"

# Поиск директории DataLens, если не указана
if [ ! -d "$DATALENS_DIR" ]; then
    step "Searching for DataLens directory..."
    
    # Поиск в стандартных местах
    POSSIBLE_DIRS=(
        "/opt/datalens"
        "/usr/local/datalens"
        "/home/datalens"
        "$(docker inspect datalens 2>/dev/null | grep -i source | head -1 | cut -d'"' -f4)"
    )
    
    for dir in "${POSSIBLE_DIRS[@]}"; do
        if [ -d "$dir" ] && [ -d "$dir/frontend" ] && [ -d "$dir/backend" ]; then
            DATALENS_DIR="$dir"
            log "Found DataLens at: $DATALENS_DIR"
            break
        fi
    done
    
    if [ ! -d "$DATALENS_DIR" ]; then
        error "DataLens directory not found!"
        error "Please set DATALENS_DIR environment variable:"
        error "  export DATALENS_DIR=/path/to/datalens"
        exit 1
    fi
fi

log "DataLens directory: $DATALENS_DIR"
log ""

# Проверка структуры
if [ ! -d "$DATALENS_DIR/frontend" ] || [ ! -d "$DATALENS_DIR/backend" ]; then
    error "Invalid DataLens structure. Expected frontend/ and backend/ directories"
    exit 1
fi

cd "$DATALENS_DIR"

# 1. Проверка существования Git репозитория
step "1. Checking Git repository..."
if [ -d ".git" ]; then
    warning "Git repository already exists!"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Aborted."
        exit 0
    fi
else
    log "Initializing Git repository..."
    git init
    log "✓ Git repository initialized"
fi

# 2. Создание .gitignore
step "2. Creating .gitignore..."
if [ -f ".gitignore" ]; then
    warning ".gitignore already exists, backing up..."
    cp .gitignore .gitignore.backup
fi

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
venv/
env/
.venv/

# Build outputs
dist/
build/
*.log
*.egg-info/
*.so
*.dylib

# Environment
.env
.env.local
.env.*.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db
desktop.ini

# DataLens specific
data/
logs/
*.db
*.sqlite
*.sqlite3

# Temporary
tmp/
temp/
*.tmp
*.bak
*.backup

# Docker
.dockerignore

# Coverage
coverage/
.nyc_output/
*.lcov

# Testing
.pytest_cache/
.coverage
htmlcov/
EOF

log "✓ .gitignore created"

# 3. Определение версии DataLens
step "3. Detecting DataLens version..."
VERSION="unknown"
if [ -f "package.json" ]; then
    VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | head -1 | cut -d'"' -f4)
fi
if [ -f "frontend/package.json" ]; then
    VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' frontend/package.json | head -1 | cut -d'"' -f4)
fi
if [ "$VERSION" = "unknown" ]; then
    VERSION="$(date +%Y%m%d)"
fi
log "Detected version: $VERSION"

# 4. Добавление файлов
step "4. Adding files to Git..."
git add .
FILES_COUNT=$(git status --short | wc -l)
log "✓ $FILES_COUNT files staged"

# 5. Создание первого commit
step "5. Creating initial commit..."
COMMIT_MSG="Initial commit: Yandex DataLens base platform for Aeronavigator

- Base DataLens installation
- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR"

git commit -m "$COMMIT_MSG" || {
    error "Commit failed. Check if there are files to commit."
    exit 1
}
log "✓ Initial commit created"

# 6. Создание ветки main (если не существует)
step "6. Setting up main branch..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
    git branch -M main
    log "✓ Main branch created"
else
    log "Current branch: $CURRENT_BRANCH"
fi

# 7. Информация о следующем шаге
log ""
log "=========================================="
log "Git repository initialized successfully!"
log "=========================================="
log ""
log "Next steps:"
log ""
log "1. Create repository on GitHub (SteGarXD):"
log "   - Repository name: datalens-aeronavigator-base"
log "   - Description: Base DataLens platform for Aeronavigator"
log "   - Visibility: Private (recommended)"
log ""
log "2. Add remote and push:"
log "   cd $DATALENS_DIR"
log "   git remote add origin https://github.com/SteGarXD/datalens-aeronavigator-base.git"
log "   git push -u origin main"
log ""
log "3. Create customizations branch:"
log "   git checkout -b aeronavigator-customizations"
log "   git push -u origin aeronavigator-customizations"
log ""
log "4. Configure upstream (optional):"
log "   git remote add upstream https://github.com/datalens-tech/datalens.git"
log ""

