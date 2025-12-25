#!/bin/bash
# Интеграция кастомизаций в запущенный контейнер

set -e

CONTAINER_NAME="${1:-datalens-ui}"
CUSTOMIZATIONS_DIR="${2:-$(pwd)/customizations}"

echo "🔧 Интеграция кастомизаций в контейнер $CONTAINER_NAME..."

# Проверка существования контейнера
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Контейнер $CONTAINER_NAME не запущен"
    exit 1
fi

# Копирование кастомизаций
echo "📦 Копирование кастомизаций..."
docker cp "$CUSTOMIZATIONS_DIR" "${CONTAINER_NAME}:/app/customizations" || {
    echo "⚠️  Не удалось скопировать кастомизации"
}

# Поиск главного файла
MAIN_FILE=""
for file in "/app/src/index.tsx" "/app/src/index.ts" "/app/index.tsx" "/app/index.ts"; do
    if docker exec "$CONTAINER_NAME" test -f "$file" 2>/dev/null; then
        MAIN_FILE="$file"
        break
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo "⚠️  Главный файл не найден"
    exit 1
fi

echo "✓ Найден главный файл: $MAIN_FILE"

# Проверка интеграции
if docker exec "$CONTAINER_NAME" grep -q "initializeCustomizations" "$MAIN_FILE" 2>/dev/null; then
    echo "✓ Кастомизации уже интегрированы"
    exit 0
fi

# Создание резервной копии
docker exec "$CONTAINER_NAME" cp "$MAIN_FILE" "${MAIN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Создание файла интеграции
INTEGRATION_CODE="// AeronavigatorBI Customizations
import { initializeCustomizations } from './customizations/integration';

// Initialize customizations before app initialization
initializeCustomizations().catch(err => {
  console.error('[AeronavigatorBI] Failed to initialize:', err);
});

"

# Добавление интеграции в начало файла
docker exec "$CONTAINER_NAME" sh -c "
cat > /tmp/integration.txt << 'EOF'
$INTEGRATION_CODE
EOF
cat $MAIN_FILE >> /tmp/integration.txt
cat /tmp/integration.txt > $MAIN_FILE
"

echo "✅ Интеграция выполнена в $MAIN_FILE"
echo ""
echo "📋 Перезапустите контейнер:"
echo "  docker restart $CONTAINER_NAME"

