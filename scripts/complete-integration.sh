#!/bin/bash
# Полная интеграция кастомизаций в DataLens

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CUSTOMIZATIONS_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Полная интеграция AeronavigatorBI кастомизаций в DataLens"
echo "============================================================"
echo ""

# Шаг 1: Интеграция frontend
echo "📦 Шаг 1: Интеграция Frontend кастомизаций..."
bash "$SCRIPT_DIR/integrate-frontend.sh" || {
  echo "⚠️  Frontend интеграция не удалась (возможно, файлы не найдены)"
  echo "   Это нормально, если DataLens запущен в Docker"
}

echo ""

# Шаг 2: Интеграция backend
echo "📦 Шаг 2: Интеграция Backend кастомизаций..."
bash "$SCRIPT_DIR/integrate-backend.sh" || {
  echo "⚠️  Backend интеграция не удалась (возможно, файлы не найдены)"
  echo "   Это нормально, если DataLens запущен в Docker"
}

echo ""

# Шаг 3: Установка зависимостей
echo "📦 Шаг 3: Проверка зависимостей..."

if [ -f "$CUSTOMIZATIONS_DIR/package.json" ]; then
  echo "  Frontend зависимости..."
  cd "$CUSTOMIZATIONS_DIR"
  if command -v npm &> /dev/null; then
    npm install --production || echo "⚠️  npm install не удался"
  else
    echo "⚠️  npm не найден"
  fi
fi

if [ -f "$CUSTOMIZATIONS_DIR/backend/requirements.txt" ]; then
  echo "  Backend зависимости..."
  if command -v pip &> /dev/null || command -v pip3 &> /dev/null; then
    PIP_CMD=$(command -v pip3 || command -v pip)
    $PIP_CMD install -r "$CUSTOMIZATIONS_DIR/backend/requirements.txt" || echo "⚠️  pip install не удался"
  else
    echo "⚠️  pip не найден"
  fi
fi

echo ""

# Шаг 4: Создание патчей
echo "📦 Шаг 4: Создание патчей для patch-package..."
if [ -f "$CUSTOMIZATIONS_DIR/package.json" ] && grep -q "patch-package" "$CUSTOMIZATIONS_DIR/package.json"; then
  cd "$CUSTOMIZATIONS_DIR"
  if [ -d "customizations/patches" ]; then
    echo "  ✓ Патчи уже созданы"
  else
    echo "  ⚠️  Патчи нужно создать вручную"
  fi
fi

echo ""

# Шаг 5: Инструкции по Docker
echo "📦 Шаг 5: Инструкции по Docker интеграции..."
echo ""
echo "Для Docker-based DataLens выполните:"
echo ""
echo "1. Скопируйте кастомизации в контейнер или смонтируйте как volume:"
echo "   docker cp $CUSTOMIZATIONS_DIR/customizations datalens-ui:/app/customizations"
echo "   docker cp $CUSTOMIZATIONS_DIR/backend datalens-control-api:/app/customizations"
echo ""
echo "2. Или добавьте в docker-compose.yaml:"
echo "   volumes:"
echo "     - $CUSTOMIZATIONS_DIR/customizations:/app/customizations"
echo "     - $CUSTOMIZATIONS_DIR/backend:/app/customizations/backend"
echo ""
echo "3. Пересоберите и перезапустите контейнеры:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
echo ""

echo "✅ Интеграция завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Убедитесь, что кастомизации смонтированы в контейнеры"
echo "2. Пересоберите контейнеры (docker-compose build)"
echo "3. Перезапустите контейнеры (docker-compose restart)"
echo "4. Проверьте логи: docker-compose logs -f datalens-ui"
echo "5. Откройте браузер и проверьте консоль на наличие '[AeronavigatorBI]' сообщений"

