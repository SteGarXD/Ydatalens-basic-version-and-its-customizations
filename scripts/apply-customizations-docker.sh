#!/bin/bash
# Применение кастомизаций к DataLens через модификацию docker-compose.yaml

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

DATALENS_DIR="${DATALENS_DIR:-$HOME/datalens}"
CUSTOMIZATIONS_DIR="$HOME/datalens-with-customizations/customizations"

log "=========================================="
log "Applying Customizations via Docker Volumes"
log "=========================================="

# Создать резервную копию docker-compose.yaml
if [ -f "$DATALENS_DIR/docker-compose.yaml" ]; then
    cp "$DATALENS_DIR/docker-compose.yaml" "$DATALENS_DIR/docker-compose.yaml.backup.$(date +%Y%m%d-%H%M%S)"
    log "✓ Backup created"
fi

# Создать модифицированный docker-compose с volumes
log "Creating modified docker-compose.yaml with customizations volumes..."

# Проверить, есть ли уже volumes для кастомизаций
if grep -q "customizations" "$DATALENS_DIR/docker-compose.yaml" 2>/dev/null; then
    warning "Customizations volumes already exist in docker-compose.yaml"
else
    # Добавить volumes для datalens-ui
    # Это требует ручного редактирования или использования yq/jq
    log "Note: Manual editing of docker-compose.yaml required"
    log "Add volumes to datalens-ui service:"
    log "  volumes:"
    log "    - $CUSTOMIZATIONS_DIR/frontend/src/customizations:/app/customizations:ro"
fi

log ""
log "=========================================="
log "Next steps:"
log "1. Edit docker-compose.yaml to add volumes for customizations"
log "2. Restart containers: cd $DATALENS_DIR && docker-compose down && docker-compose up -d"
log "3. Verify customizations are loaded"
log "=========================================="

