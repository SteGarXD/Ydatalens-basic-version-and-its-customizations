#!/bin/bash
# Скрипт для интеграции кастомизаций в главный файл DataLens Backend

set -e

DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
CUSTOMIZATIONS_DIR="${CUSTOMIZATIONS_DIR:-$(pwd)}"

echo "🔧 Интеграция кастомизаций в DataLens Backend..."

# Найти главный файл backend
MAIN_FILES=(
  "$DATALENS_DIR/backend/app/main.py"
  "$DATALENS_DIR/backend/main.py"
  "$DATALENS_DIR/app/main.py"
  "$DATALENS_DIR/main.py"
)

MAIN_FILE=""
for file in "${MAIN_FILES[@]}"; do
  if [ -f "$file" ]; then
    MAIN_FILE="$file"
    echo "✓ Найден главный файл: $MAIN_FILE"
    break
  fi
done

if [ -z "$MAIN_FILE" ]; then
  echo "⚠️  Главный файл не найден. Попробуйте найти вручную и добавить:"
  echo ""
  echo "from customizations.integration import initialize_customizations"
  echo ""
  echo "# В функции создания app или в startup event:"
  echo "initialize_customizations(app)"
  exit 1
fi

# Проверить, есть ли уже интеграция
if grep -q "initialize_customizations" "$MAIN_FILE" 2>/dev/null; then
  echo "✓ Кастомизации уже интегрированы в $MAIN_FILE"
  exit 0
fi

# Создать резервную копию
cp "$MAIN_FILE" "${MAIN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Создана резервная копия: ${MAIN_FILE}.backup.*"

# Определить путь к кастомизациям
MAIN_DIR=$(dirname "$MAIN_FILE")
RELATIVE_PATH=$(realpath --relative-to="$MAIN_DIR" "$CUSTOMIZATIONS_DIR/backend" 2>/dev/null || echo "../customizations/backend")

# Попробовать добавить импорт и вызов
if grep -q "from fastapi import FastAPI" "$MAIN_FILE" || grep -q "app = FastAPI" "$MAIN_FILE"; then
  # Добавить импорт после других импортов
  sed -i "/^from fastapi import/a # AeronavigatorBI Customizations\nfrom ${RELATIVE_PATH//\//.}.integration import initialize_customizations" "$MAIN_FILE"
  
  # Найти место создания app и добавить инициализацию
  if grep -q "app = FastAPI" "$MAIN_FILE"; then
    sed -i "/app = FastAPI/a \n# Initialize AeronavigatorBI customizations\ninitialize_customizations(app)" "$MAIN_FILE"
  elif grep -q "@app.on_event(\"startup\")" "$MAIN_FILE" || grep -q "async def startup" "$MAIN_FILE"; then
    # Добавить в startup event
    sed -i "/@app.on_event(\"startup\")/a     initialize_customizations(app)" "$MAIN_FILE" || \
    sed -i "/async def startup/a     initialize_customizations(app)" "$MAIN_FILE"
  else
    # Добавить в конец файла перед if __name__ == "__main__"
    sed -i "/if __name__/i # Initialize AeronavigatorBI customizations\ninitialize_customizations(app)\n" "$MAIN_FILE"
  fi
  
  echo "✅ Кастомизации интегрированы в $MAIN_FILE"
else
  echo "⚠️  Не удалось автоматически интегрировать. Добавьте вручную:"
  echo ""
  echo "from ${RELATIVE_PATH//\//.}.integration import initialize_customizations"
  echo ""
  echo "# После создания app:"
  echo "initialize_customizations(app)"
fi

