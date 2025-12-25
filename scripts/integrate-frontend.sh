#!/bin/bash
# Скрипт для интеграции кастомизаций в главный файл DataLens UI

set -e

DATALENS_DIR="${DATALENS_DIR:-/opt/datalens}"
CUSTOMIZATIONS_DIR="${CUSTOMIZATIONS_DIR:-$(pwd)}"

echo "🔧 Интеграция кастомизаций в DataLens UI..."

# Найти главный файл приложения
MAIN_FILES=(
  "$DATALENS_DIR/frontend/src/index.tsx"
  "$DATALENS_DIR/frontend/src/index.ts"
  "$DATALENS_DIR/frontend/src/App.tsx"
  "$DATALENS_DIR/frontend/src/main.tsx"
  "$DATALENS_DIR/src/index.tsx"
  "$DATALENS_DIR/src/index.ts"
  "$DATALENS_DIR/src/App.tsx"
  "$DATALENS_DIR/src/main.tsx"
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
  echo "import { initializeCustomizations } from './customizations/integration';"
  echo "initializeCustomizations().catch(err => {"
  echo "  console.error('[AeronavigatorBI] Failed to initialize:', err);"
  echo "});"
  exit 1
fi

# Проверить, есть ли уже интеграция
if grep -q "initializeCustomizations" "$MAIN_FILE" 2>/dev/null; then
  echo "✓ Кастомизации уже интегрированы в $MAIN_FILE"
  exit 0
fi

# Создать резервную копию
cp "$MAIN_FILE" "${MAIN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Создана резервная копия: ${MAIN_FILE}.backup.*"

# Определить путь к кастомизациям относительно главного файла
MAIN_DIR=$(dirname "$MAIN_FILE")
RELATIVE_PATH=$(realpath --relative-to="$MAIN_DIR" "$CUSTOMIZATIONS_DIR/customizations" 2>/dev/null || echo "customizations")

# Добавить импорт и вызов в начало файла
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
// AeronavigatorBI Customizations - Auto-integrated
import { initializeCustomizations } from './${RELATIVE_PATH}/integration';

// Initialize customizations before app initialization
initializeCustomizations().catch(err => {
  console.error('[AeronavigatorBI] Failed to initialize customizations:', err);
});

EOF

# Добавить оригинальное содержимое
cat "$MAIN_FILE" >> "$TEMP_FILE"

# Заменить файл
mv "$TEMP_FILE" "$MAIN_FILE"

echo "✅ Кастомизации интегрированы в $MAIN_FILE"
echo ""
echo "Добавлен код:"
echo "  import { initializeCustomizations } from './${RELATIVE_PATH}/integration';"
echo "  initializeCustomizations();"

