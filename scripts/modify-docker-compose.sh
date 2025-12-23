#!/bin/bash
# Модификация docker-compose.yaml для добавления volumes с кастомизациями

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

DATALENS_DIR="${DATALENS_DIR:-$HOME/datalens}"
CUSTOMIZATIONS_VOLUME="$HOME/datalens-with-customizations/customizations/frontend/src/customizations"

log "Modifying docker-compose.yaml to add customizations volumes..."

cd "$DATALENS_DIR"

# Создать резервную копию
BACKUP_FILE="docker-compose.yaml.backup.$(date +%Y%m%d-%H%M%S)"
cp docker-compose.yaml "$BACKUP_FILE"
log "✓ Backup created: $BACKUP_FILE"

# Проверить, есть ли уже volumes для кастомизаций
if grep -q "datalens-with-customizations" docker-compose.yaml; then
    warning "Customizations volumes already exist"
    exit 0
fi

# Добавить volumes для datalens-ui используя sed
# Ищем секцию datalens-ui и добавляем volumes после существующих volumes или после image

# Создать временный файл с добавлением volumes
TMP_FILE=$(mktemp)

# Используем awk для более точной вставки
awk -v custom_path="$CUSTOMIZATIONS_VOLUME" '
/datalens-ui:/ {
    print
    in_ui_service = 1
    next
}
in_ui_service && /^[[:space:]]*image:/ {
    print
    # Добавляем volumes после image
    print "    volumes:"
    print "      - " custom_path ":/opt/app/src/customizations:ro"
    in_ui_service = 0
    next
}
in_ui_service && /^[[:space:]]*volumes:/ {
    print
    # Если volumes уже есть, добавляем наш volume
    getline
    while (/^[[:space:]]+-/ || /^[[:space:]]*$/) {
        print
        getline
    }
    print "      - " custom_path ":/opt/app/src/customizations:ro"
    in_ui_service = 0
    print
    next
}
in_ui_service && /^[[:space:]]*[a-zA-Z]/ && !/^[[:space:]]*#/ {
    # Другая секция началась, добавляем volumes перед ней
    print "    volumes:"
    print "      - " custom_path ":/opt/app/src/customizations:ro"
    in_ui_service = 0
    print
    next
}
{
    print
}
' docker-compose.yaml > "$TMP_FILE"

mv "$TMP_FILE" docker-compose.yaml.new

log "✓ Modified docker-compose.yaml created: docker-compose.yaml.new"
log ""
log "Review the changes:"
log "  diff docker-compose.yaml docker-compose.yaml.new"
log ""
log "To apply:"
log "  mv docker-compose.yaml.new docker-compose.yaml"
log "  docker-compose down"
log "  docker-compose up -d"

