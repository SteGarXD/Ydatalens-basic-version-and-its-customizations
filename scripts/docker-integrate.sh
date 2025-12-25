#!/bin/bash
# Интеграция кастомизаций через Docker (копирование в контейнеры)

set -e

CUSTOMIZATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🐳 Интеграция кастомизаций через Docker..."
echo ""

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден"
    exit 1
fi

# Поиск контейнеров DataLens
UI_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i "datalens.*ui\|ui.*datalens" | head -1)
BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i "datalens.*api\|api.*datalens\|datalens.*backend\|backend.*datalens" | head -1)

if [ -z "$UI_CONTAINER" ]; then
    echo "⚠️  Контейнер DataLens UI не найден"
    echo "   Попробуйте: docker ps | grep datalens"
else
    echo "✓ Найден UI контейнер: $UI_CONTAINER"
    
    # Копирование frontend кастомизаций
    echo "  Копирование frontend кастомизаций..."
    docker cp "$CUSTOMIZATIONS_DIR/customizations" "$UI_CONTAINER:/app/customizations" 2>/dev/null || {
        echo "  ⚠️  Не удалось скопировать (возможно, контейнер не запущен или путь неверный)"
        echo "  Попробуйте вручную: docker cp $CUSTOMIZATIONS_DIR/customizations $UI_CONTAINER:/app/"
    }
fi

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "⚠️  Контейнер DataLens Backend не найден"
else
    echo "✓ Найден Backend контейнер: $BACKEND_CONTAINER"
    
    # Копирование backend кастомизаций
    echo "  Копирование backend кастомизаций..."
    docker cp "$CUSTOMIZATIONS_DIR/backend" "$BACKEND_CONTAINER:/app/customizations/backend" 2>/dev/null || {
        echo "  ⚠️  Не удалось скопировать (возможно, контейнер не запущен или путь неверный)"
        echo "  Попробуйте вручную: docker cp $CUSTOMIZATIONS_DIR/backend $BACKEND_CONTAINER:/app/customizations/"
    }
fi

echo ""
echo "✅ Копирование завершено"
echo ""
echo "📋 Следующие шаги:"
echo "1. Интегрируйте initializeCustomizations() в главный файл UI контейнера"
echo "2. Интегрируйте initialize_customizations() в главный файл Backend контейнера"
echo "3. Перезапустите контейнеры: docker-compose restart"
echo ""

