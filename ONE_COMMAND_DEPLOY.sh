#!/bin/bash
# ОДНА КОМАНДА ДЛЯ ПОЛНОГО РАЗВЕРТЫВАНИЯ
# Выполняет все шаги автоматически

set -e

echo "🚀 ПОЛНОЕ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ AERONAVIGATORBI"
echo "======================================================"
echo ""

# Определение директорий
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Запуск основного скрипта развертывания
if [ -f "scripts/auto-deploy-server.sh" ]; then
    chmod +x scripts/auto-deploy-server.sh
    bash scripts/auto-deploy-server.sh
else
    echo "❌ Скрипт auto-deploy-server.sh не найден"
    exit 1
fi

echo ""
echo "✅ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo ""
echo "📋 Теперь выполните на сервере:"
echo ""
echo "  cd ~/Ydatalens-basic-version-and-its-customizations"
echo "  docker-compose down"
echo "  docker-compose build --no-cache"
echo "  docker-compose up -d"
echo "  docker-compose logs -f datalens-ui | grep AeronavigatorBI"
echo ""

