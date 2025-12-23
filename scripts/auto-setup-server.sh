#!/bin/bash
# Полностью автоматическая настройка на сервере
# Выполняет ВСЁ: клонирует репозиторий, создает ветку master с базовой версией
# Запускать на сервере Linux Ubuntu одной командой

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
log "Automatic Server Setup - Add Base to Master"
log "=========================================="
log ""

# Автоматическое определение DataLens
step "1. Auto-detecting DataLens directory..."
DATALENS_DIR=""

# Поиск в стандартных местах
for dir in /opt/datalens /usr/local/datalens /home/datalens; do
    if [ -d "$dir" ] && [ -d "$dir/frontend" ] && [ -d "$dir/backend" ]; then
        DATALENS_DIR="$dir"
        log "✓ Found DataLens at: $DATALENS_DIR"
        break
    fi
done

# Проверка Docker
if [ -z "$DATALENS_DIR" ]; then
    DOCKER_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i datalens | head -1)
    if [ -n "$DOCKER_CONTAINER" ]; then
        log "Found DataLens in Docker container: $DOCKER_CONTAINER"
        # Попробовать найти volume или workdir
        DOCKER_VOLUME=$(docker inspect "$DOCKER_CONTAINER" 2>/dev/null | grep -i "source\|mountpoint" | head -1 | cut -d'"' -f4 || echo "")
        if [ -n "$DOCKER_VOLUME" ] && [ -d "$DOCKER_VOLUME" ]; then
            DATALENS_DIR="$DOCKER_VOLUME"
        fi
    fi
fi

# Проверка systemd
if [ -z "$DATALENS_DIR" ]; then
    SYSTEMD_SERVICE=$(systemctl list-units --type=service | grep -i datalens | head -1 | awk '{print $1}')
    if [ -n "$SYSTEMD_SERVICE" ]; then
        log "Found DataLens service: $SYSTEMD_SERVICE"
        # Попробовать найти путь из конфигурации
        SERVICE_FILE=$(systemctl show "$SYSTEMD_SERVICE" -p FragmentPath --value 2>/dev/null || echo "")
        if [ -n "$SERVICE_FILE" ] && [ -f "$SERVICE_FILE" ]; then
            WORKING_DIR=$(grep -i "WorkingDirectory\|ExecStart" "$SERVICE_FILE" | head -1 | awk '{print $2}' || echo "")
            if [ -n "$WORKING_DIR" ] && [ -d "$WORKING_DIR" ]; then
                DATALENS_DIR="$WORKING_DIR"
            fi
        fi
    fi
fi

if [ -z "$DATALENS_DIR" ]; then
    error "DataLens directory not found automatically"
    error "Please set DATALENS_DIR manually:"
    error "  export DATALENS_DIR=/path/to/datalens"
    error "  ./scripts/auto-setup-server.sh"
    exit 1
fi

log "Using DataLens directory: $DATALENS_DIR"
log ""

# 2. Клонировать единый репозиторий
step "2. Cloning unified repository..."
UNIFIED_REPO_DIR="/opt/Ydatalens-basic-version-and-its-customizations"

if [ -d "$UNIFIED_REPO_DIR" ]; then
    warning "Repository already exists, updating..."
    cd "$UNIFIED_REPO_DIR"
    git fetch origin 2>/dev/null || true
else
    cd /opt
    git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git 2>/dev/null || {
        error "Failed to clone repository"
        error "Please check:"
        error "  1. Repository exists on GitHub"
        error "  2. You have access to the repository"
        error "  3. Git is installed: sudo apt install git"
        exit 1
    }
    log "✓ Repository cloned"
fi

cd "$UNIFIED_REPO_DIR"

# Настроить Git
git config core.autocrlf true 2>/dev/null || true
git config core.eol lf 2>/dev/null || true

# 3. Создать/обновить ветку master с базовой версией
step "3. Creating/updating master branch with base DataLens..."

# Проверить существует ли master
if git show-ref --verify --quiet refs/heads/master; then
    log "Master branch exists, switching to it..."
    git checkout master
    # Очистить для обновления
    find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} + 2>/dev/null || true
else
    log "Creating new master branch..."
    git checkout --orphan master 2>/dev/null || git checkout -b master
    git rm -rf . 2>/dev/null || true
fi

# Копировать базовую версию DataLens
log "Copying base DataLens files from $DATALENS_DIR..."
cp -r "$DATALENS_DIR"/* . 2>/dev/null || true
cp -r "$DATALENS_DIR"/.[!.]* . 2>/dev/null || true

# Создать .gitignore
cat > .gitignore << 'EOF'
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
dist/
build/
*.log
*.egg-info/
.env
.env.local
.env.*.local
.env.production
data/
logs/
*.db
*.sqlite
*.sqlite3
tmp/
temp/
*.tmp
EOF

# Создать README для master
cat > README.md << 'EOF'
# Базовая версия Yandex DataLens

Это базовая, оригинальная версия Yandex DataLens Open Source.

## Описание

Базовая on-premise версия DataLens без дополнительных функций облачной версии.

## Ветки

- `master` - Базовая версия (эта ветка)
- `customizations` - Все кастомизации и улучшения

## Использование

Эта ветка содержит чистую версию DataLens. Для версии с кастомизациями см. ветку `customizations`.

## Объединение

Для объединения с кастомизациями:

```bash
git checkout master
git merge customizations
./scripts/apply-customizations.sh
```
EOF

# Commit базовой версии
git add . 2>/dev/null || true
VERSION=$(cat frontend/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo "unknown")
COMMIT_MSG="Base Yandex DataLens installation

- Base DataLens from server
- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR
- Auto-generated by setup script"

git commit -m "$COMMIT_MSG" 2>/dev/null || {
    error "Failed to commit base version"
    error "Check if there are files to commit"
    exit 1
}

log "✓ Master branch created/updated with base DataLens"

# 4. Push в GitHub
step "4. Pushing master branch to GitHub..."
log "Pushing master branch..."

if git push -u origin master 2>/dev/null; then
    log "✓ Master branch pushed successfully"
else
    warning "Failed to push master branch"
    warning "Possible reasons:"
    warning "  1. Need authentication (SSH key or token)"
    warning "  2. No write access to repository"
    warning "  3. Network issues"
    warning ""
    warning "To push manually:"
    warning "  git push -u origin master"
    warning ""
    warning "Or set up authentication:"
    warning "  git remote set-url origin https://USERNAME:TOKEN@github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git"
fi

# 5. Проверка результата
step "5. Verifying setup..."
log "Checking branches..."
git branch -a

log ""
log "=========================================="
log "Setup completed!"
log "=========================================="
log ""
log "Repository: https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations"
log ""
log "Branches:"
log "  ✓ master - Base Yandex DataLens (from server)"
log "  ✓ customizations - All customizations (from Windows)"
log ""
log "Next steps:"
log "1. Verify branches on GitHub"
log "2. To merge customizations into master:"
log "   git checkout master"
log "   git merge customizations"
log "   ./scripts/apply-customizations.sh"
log "   git push origin master"
log ""

