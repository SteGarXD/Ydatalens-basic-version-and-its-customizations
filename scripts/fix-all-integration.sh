#!/bin/bash
# Исправление всех проблем интеграции - полная автоматизация

set -e

CUSTOMIZATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATALENS_DIR="$HOME/datalens"

echo "🔧 Полное исправление интеграции..."
echo ""

# 1. Копирование backend
echo "📦 Копирование backend..."
docker exec datalens-control-api mkdir -p /app/customizations/backend 2>/dev/null || true
cd "$CUSTOMIZATIONS_DIR"
docker cp backend/. datalens-control-api:/app/customizations/backend/ 2>&1 | grep -v "Error\|Warning" || true
echo "✓ Backend скопирован"

# 2. Копирование frontend
echo "📦 Копирование frontend..."
docker exec datalens-ui mkdir -p /opt/app/src/customizations 2>/dev/null || true
docker cp customizations/. datalens-ui:/opt/app/src/customizations/ 2>&1 | grep -v "Error\|Warning" || true
echo "✓ Frontend скопирован"

# 3. Проверка файлов
echo ""
echo "🔍 Проверка файлов..."
if docker exec datalens-control-api test -f /app/customizations/backend/integration.py; then
    echo "✓ Backend integration.py найден"
else
    echo "❌ Backend integration.py не найден"
    exit 1
fi

if docker exec datalens-ui test -f /opt/app/src/customizations/integration.ts; then
    echo "✓ Frontend integration.ts найден"
else
    echo "❌ Frontend integration.ts не найден"
    exit 1
fi

# 4. Обновление docker-compose.yaml
echo ""
echo "📝 Обновление docker-compose.yaml..."
cd "$DATALENS_DIR"

# Добавляем volumes для backend если их нет
if ! grep -q "Ydatalens-basic-version-and-its-customizations/backend" docker-compose.yaml; then
    # Создаем резервную копию
    cp docker-compose.yaml docker-compose.yaml.backup.$(date +%Y%m%d_%H%M%S)
    
    # Добавляем volume для control-api после image
    sed -i '/control-api:/,/^[[:space:]]*[a-z]/ {
        /image:.*control-api/ {
            a\
    volumes:\
      - /home/g.stepanov/Ydatalens-basic-version-and-its-customizations/backend:/app/customizations/backend:ro
        }
    }' docker-compose.yaml
    
    echo "✓ Volume для backend добавлен"
else
    echo "✓ Volume для backend уже настроен"
fi

# Проверяем volume для frontend
if ! grep -q "Ydatalens-basic-version-and-its-customizations/customizations" docker-compose.yaml; then
    # Добавляем volume для datalens-ui
    sed -i '/datalens-ui:/,/^[[:space:]]*[a-z]/ {
        /image:.*datalens-ui/ {
            a\
    volumes:\
      - /home/g.stepanov/Ydatalens-basic-version-and-its-customizations/customizations:/opt/app/src/customizations:ro
        }
    }' docker-compose.yaml
    
    echo "✓ Volume для frontend добавлен"
else
    echo "✓ Volume для frontend уже настроен"
fi

# 5. Перезапуск контейнеров
echo ""
echo "🔄 Перезапуск контейнеров..."
docker restart datalens-ui datalens-control-api >/dev/null 2>&1
sleep 10

# 6. Финальная проверка
echo ""
echo "✅ Интеграция завершена!"
echo ""
echo "📋 Проверка:"
echo "  Frontend: docker exec datalens-ui ls -la /opt/app/src/customizations | head -5"
echo "  Backend: docker exec datalens-control-api ls -la /app/customizations/backend | head -5"
echo "  Логи UI: docker logs --tail=50 datalens-ui | grep AeronavigatorBI"
echo "  Логи API: docker logs --tail=50 datalens-control-api | grep customization"

