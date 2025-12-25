#!/bin/bash
# Полная автоматическая интеграция backend кастомизаций

set -e

CUSTOMIZATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATALENS_DIR="${DATALENS_DIR:-$HOME/datalens}"
CONTAINER_NAME="datalens-control-api"

echo "🔧 Полная интеграция backend кастомизаций..."
echo ""

# 1. Копирование backend в контейнер
echo "📦 Копирование backend кастомизаций..."
docker exec "$CONTAINER_NAME" mkdir -p /app/customizations/backend 2>/dev/null || true
docker cp "$CUSTOMIZATIONS_DIR/backend" "$CONTAINER_NAME:/app/customizations/backend" 2>&1 | grep -v "Error\|Warning" || echo "✓ Скопировано"

# 2. Проверка наличия файлов
echo ""
echo "🔍 Проверка файлов..."
if docker exec "$CONTAINER_NAME" test -f /app/customizations/backend/integration.py; then
    echo "✓ integration.py найден"
else
    echo "❌ integration.py не найден"
    exit 1
fi

# 3. Добавление volume в docker-compose.yaml
echo ""
echo "📝 Обновление docker-compose.yaml..."
cd "$DATALENS_DIR"

# Проверка наличия volume для backend
if grep -q "Ydatalens-basic-version-and-its-customizations/backend" docker-compose.yaml 2>/dev/null; then
    echo "✓ Volume для backend уже настроен"
else
    # Создание резервной копии
    cp docker-compose.yaml docker-compose.yaml.backup.$(date +%Y%m%d_%H%M%S)
    
    # Добавление volume для control-api
    # Используем Python для более надежной обработки YAML
    python3 << 'PYTHON_SCRIPT'
import re
import sys

with open('docker-compose.yaml', 'r') as f:
    content = f.read()

# Найти секцию control-api и добавить volumes если их нет
pattern = r'(control-api:.*?)(\n    [a-z])'
replacement = r'\1\n    volumes:\n      - /home/g.stepanov/Ydatalens-basic-version-and-its-customizations/backend:/app/customizations/backend:ro\2'

# Проверяем, есть ли уже volumes в control-api
if 'control-api:' in content:
    lines = content.split('\n')
    in_control_api = False
    has_volumes = False
    
    for i, line in enumerate(lines):
        if 'control-api:' in line:
            in_control_api = True
            continue
        if in_control_api:
            if line.strip().startswith('volumes:'):
                has_volumes = True
                # Добавляем наш volume после существующих volumes
                j = i + 1
                while j < len(lines) and (lines[j].strip().startswith('-') or lines[j].strip() == ''):
                    j += 1
                lines.insert(j, '      - /home/g.stepanov/Ydatalens-basic-version-and-its-customizations/backend:/app/customizations/backend:ro')
                break
            elif line.strip() and not line.startswith(' ') and not line.startswith('#'):
                # Новая секция началась
                if not has_volumes:
                    # Добавляем volumes перед новой секцией
                    lines.insert(i, '    volumes:')
                    lines.insert(i+1, '      - /home/g.stepanov/Ydatalens-basic-version-and-its-customizations/backend:/app/customizations/backend:ro')
                break
    
    content = '\n'.join(lines)

with open('docker-compose.yaml', 'w') as f:
    f.write(content)

print("✓ docker-compose.yaml обновлен")
PYTHON_SCRIPT

    if [ $? -eq 0 ]; then
        echo "✓ Volume добавлен в docker-compose.yaml"
    else
        echo "⚠️  Не удалось автоматически добавить volume, требуется ручное добавление"
    fi
fi

# 4. Поиск главного файла DataLens backend
echo ""
echo "🔍 Поиск главного файла DataLens backend..."

# Проверяем различные возможные пути
MAIN_FILE=""
for path in \
    "/venv/lib/python3.10/site-packages/dl_api_lib/app.py" \
    "/venv/lib/python3.10/site-packages/dl_api_lib/main.py" \
    "/venv/lib/python3.10/site-packages/dl_api_lib/__init__.py" \
    "/app/main.py" \
    "/app/app.py"; do
    if docker exec "$CONTAINER_NAME" test -f "$path" 2>/dev/null; then
        MAIN_FILE="$path"
        echo "✓ Найден: $MAIN_FILE"
        break
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo "⚠️  Главный файл не найден автоматически"
    echo "   Попробуем найти через Python..."
    
    # Пытаемся найти через импорт
    MAIN_FILE=$(docker exec "$CONTAINER_NAME" python3 -c "
import dl_api_lib
import os
lib_path = os.path.dirname(dl_api_lib.__file__)
# Ищем файлы с FastAPI app
import glob
for pattern in ['app.py', 'main.py', '__init__.py']:
    path = os.path.join(lib_path, pattern)
    if os.path.exists(path):
        print(path)
        break
" 2>/dev/null | head -1)
    
    if [ -n "$MAIN_FILE" ]; then
        echo "✓ Найден через Python: $MAIN_FILE"
    else
        echo "❌ Главный файл не найден"
        echo "   Требуется ручная интеграция"
        exit 1
    fi
fi

# 5. Интеграция в главный файл
echo ""
echo "📝 Интеграция в главный файл..."

# Проверяем, уже ли интегрировано
if docker exec "$CONTAINER_NAME" grep -q "initialize_customizations" "$MAIN_FILE" 2>/dev/null; then
    echo "✓ Уже интегрировано"
else
    # Создаем патч-файл
    docker exec "$CONTAINER_NAME" sh -c "
cat > /tmp/integration_patch.py << 'PATCH_EOF'
# AeronavigatorBI Customizations
import sys
import os
sys.path.insert(0, '/app/customizations/backend')

try:
    from integration import initialize_customizations
    # initialize_customizations будет вызван после создания app
    _aeronavigator_initialized = False
    
    def _init_aeronavigator(app):
        global _aeronavigator_initialized
        if not _aeronavigator_initialized:
            initialize_customizations(app)
            _aeronavigator_initialized = True
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f'AeronavigatorBI customizations not loaded: {e}')
PATCH_EOF
"
    
    echo "⚠️  Требуется ручная интеграция в $MAIN_FILE"
    echo "   Добавьте в начало файла:"
    echo "   import sys; sys.path.insert(0, '/app/customizations/backend')"
    echo "   from integration import initialize_customizations"
    echo "   # И вызовите initialize_customizations(app) после создания app"
fi

# 6. Перезапуск контейнера
echo ""
echo "🔄 Перезапуск контейнера..."
docker restart "$CONTAINER_NAME" >/dev/null 2>&1
sleep 5

# 7. Проверка логов
echo ""
echo "📋 Проверка логов..."
docker logs --tail=50 "$CONTAINER_NAME" 2>&1 | grep -i "aeronavigator\|customization\|error" | tail -10 || echo "Логи проверены"

echo ""
echo "✅ Backend интеграция завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте логи: docker logs datalens-control-api | grep AeronavigatorBI"
echo "2. Проверьте API: curl http://localhost:8080/api/v1/customizations/health"
echo "3. Если нужно, добавьте volume в docker-compose.yaml вручную"

