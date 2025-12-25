# 🚀 РАЗВЕРТЫВАНИЕ - ОДНА КОМАНДА

## На сервере выполните:

```bash
cd ~/Ydatalens-basic-version-and-its-customizations
git checkout customizations
git pull origin customizations
chmod +x scripts/auto-deploy-server.sh
./scripts/auto-deploy-server.sh
```

## После выполнения скрипта:

```bash
# Пересобрать и перезапустить контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверить логи
docker-compose logs -f datalens-ui | grep AeronavigatorBI
```

## Готово! ✅

Все кастомизации интегрированы и работают.

Подробные инструкции: `DEPLOYMENT_AUTOMATED.md`

