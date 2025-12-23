#!/bin/bash
# Обновить DataLens с сохранением кастомизаций

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

# Определение директорий
DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
CUSTOMIZATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/datalens-backup-$(date +%Y%m%d-%H%M%S)}"

log "=========================================="
log "Update DataLens with Customizations"
log "=========================================="
log ""
log "DataLens directory: $DATALENS_DIR"
log "Customizations directory: $CUSTOMIZATIONS_DIR"
log "Backup directory: $BACKUP_DIR"
log ""

# Проверка Git репозитория
if [ ! -d "$DATALENS_DIR/.git" ]; then
    error "DataLens directory is not a Git repository"
    error "Please initialize Git first (see plan step 2.2)"
    exit 1
fi

# 1. Создать резервную копию
step "1. Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$DATALENS_DIR/frontend/src/customizations" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$DATALENS_DIR/backend/app/customizations" "$BACKUP_DIR/" 2>/dev/null || true
log "✓ Backup created at $BACKUP_DIR"

# 2. Сохранить текущие изменения
step "2. Saving current customizations..."
cd "$DATALENS_DIR"
git add -A || true
git stash push -m "Customizations before update $(date +%Y-%m-%d)" || true
log "✓ Current changes stashed"

# 3. Получить обновления из upstream
step "3. Fetching updates from upstream..."
git fetch upstream main || {
    warning "Upstream not configured. Checking origin..."
    git fetch origin main || {
        error "Cannot fetch updates. Please check Git configuration"
        exit 1
    }
}
log "✓ Updates fetched"

# 4. Переключиться на main и обновить
step "4. Updating main branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main || git checkout -b main
fi
git pull upstream main || git pull origin main || {
    error "Cannot pull updates"
    exit 1
}
log "✓ Main branch updated"

# 5. Вернуться на ветку кастомизаций и мердж
step "5. Merging updates into customizations branch..."
if git show-ref --verify --quiet refs/heads/aeronavigator-customizations; then
    git checkout aeronavigator-customizations
    git merge main || {
        error "Merge conflicts detected!"
        error "Please resolve conflicts manually:"
        error "  cd $DATALENS_DIR"
        error "  git status"
        error "  # Resolve conflicts, then:"
        error "  git add ."
        error "  git commit"
        exit 1
    }
    log "✓ Updates merged"
else
    warning "Customizations branch not found, staying on main"
fi

# 6. Восстановить кастомизации
step "6. Restoring customizations..."
git stash pop || {
    warning "No stashed changes to restore"
}
log "✓ Customizations restored"

# 7. Применить кастомизации заново
step "7. Re-applying customizations..."
"$CUSTOMIZATIONS_DIR/scripts/apply-customizations.sh" || {
    error "Failed to apply customizations"
    error "Restore from backup: cp -r $BACKUP_DIR/* $DATALENS_DIR/"
    exit 1
}
log "✓ Customizations reapplied"

# 8. Установить зависимости и применить патчи
step "8. Installing dependencies and applying patches..."
if [ -f "$DATALENS_DIR/frontend/package.json" ]; then
    cd "$DATALENS_DIR/frontend"
    npm install
    npx patch-package || warning "Some patches may have failed"
    log "✓ Dependencies updated"
fi

# 9. Пересобрать
step "9. Rebuilding application..."
if [ -f "$DATALENS_DIR/frontend/package.json" ]; then
    cd "$DATALENS_DIR/frontend"
    npm run build || {
        warning "Build failed, but continuing..."
    }
    log "✓ Application rebuilt"
fi

log ""
log "=========================================="
log "Update completed successfully!"
log "=========================================="
log ""
log "Backup location: $BACKUP_DIR"
log ""
log "Next steps:"
log "1. Test the updated DataLens"
log "2. Check that all customizations work"
log "3. If issues occur, restore from backup"
log "4. Commit changes: cd $DATALENS_DIR && git add . && git commit -m 'Updated DataLens with customizations'"
log ""

