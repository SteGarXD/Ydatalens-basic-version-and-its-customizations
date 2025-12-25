#!/bin/bash
# Интеграция initializeCustomizations в главный файл DataLens

set -e

CONTAINER_NAME="${1:-datalens-ui}"

echo "🔧 Интеграция в главный файл контейнера $CONTAINER_NAME..."

# Поиск главного файла
MAIN_FILES=(
    "/opt/app/src/index.tsx"
    "/opt/app/src/index.ts"
    "/opt/app/src/App.tsx"
    "/opt/app/src/main.tsx"
    "/app/src/index.tsx"
    "/app/src/index.ts"
    "/app/index.tsx"
    "/app/index.ts"
)

MAIN_FILE=""
for file in "${MAIN_FILES[@]}"; do
    if docker exec "$CONTAINER_NAME" test -f "$file" 2>/dev/null; then
        MAIN_FILE="$file"
        break
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo "❌ Главный файл не найден"
    exit 1
fi

echo "✓ Найден главный файл: $MAIN_FILE"

# Проверка интеграции
if docker exec "$CONTAINER_NAME" grep -q "initializeCustomizations" "$MAIN_FILE" 2>/dev/null; then
    echo "✓ Уже интегрировано"
    exit 0
fi

# Создание резервной копии
docker exec "$CONTAINER_NAME" cp "$MAIN_FILE" "${MAIN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Определение пути к кастомизациям
if [[ "$MAIN_FILE" == /opt/app/src/* ]]; then
    CUSTOMIZATIONS_PATH="./customizations/integration"
else
    CUSTOMIZATIONS_PATH="./customizations/integration"
fi

# Создание файла интеграции
docker exec "$CONTAINER_NAME" sh -c "
cat > /tmp/integration.txt << 'INTEGRATION_EOF'
// AeronavigatorBI Customizations
import { initializeCustomizations } from '$CUSTOMIZATIONS_PATH';

// Initialize customizations before app initialization
initializeCustomizations().catch(err => {
  console.error('[AeronavigatorBI] Failed to initialize:', err);
});

INTEGRATION_EOF
cat $MAIN_FILE >> /tmp/integration.txt
cat /tmp/integration.txt > $MAIN_FILE
"

echo "✅ Интеграция выполнена в $MAIN_FILE"
echo ""
echo "📋 Перезапустите контейнер:"
echo "  docker restart $CONTAINER_NAME"

