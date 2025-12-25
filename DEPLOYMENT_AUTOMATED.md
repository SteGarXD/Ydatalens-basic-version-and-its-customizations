# 🚀 Автоматическое развертывание - ОДНА КОМАНДА

## Быстрый старт

### На сервере выполните:

```bash
cd ~/Ydatalens-basic-version-and-its-customizations
git checkout customizations
git pull origin customizations
chmod +x scripts/auto-deploy-server.sh
./scripts/auto-deploy-server.sh
```

Скрипт автоматически:
1. ✅ Обновит код из Git
2. ✅ Установит все зависимости
3. ✅ Интегрирует кастомизации в DataLens
4. ✅ Настроит Docker volumes
5. ✅ Даст инструкции по перезапуску

---

## После выполнения скрипта

### 1. Проверьте интеграцию

Скрипт автоматически интегрирует кастомизации, но проверьте:

**Frontend:** Откройте файл (обычно `frontend/src/index.tsx`) и убедитесь, что есть:
```typescript
import { initializeCustomizations } from './customizations/integration';
initializeCustomizations();
```

**Backend:** Откройте файл (обычно `backend/app/main.py`) и убедитесь, что есть:
```python
from customizations.integration import initialize_customizations
initialize_customizations(app)
```

### 2. Добавьте volumes в docker-compose.yaml

Если скрипт не смог автоматически добавить volumes, добавьте вручную:

```yaml
services:
  datalens-ui:
    volumes:
      - ~/Ydatalens-basic-version-and-its-customizations/customizations:/app/customizations:ro
  
  datalens-control-api:
    volumes:
      - ~/Ydatalens-basic-version-and-its-customizations/backend:/app/customizations/backend:ro
```

### 3. Пересоберите и перезапустите

```bash
cd ~/Ydatalens-basic-version-and-its-customizations  # или где находится docker-compose.yaml
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 4. Проверьте логи

```bash
docker-compose logs -f datalens-ui | grep AeronavigatorBI
```

Должны появиться сообщения:
```
[AeronavigatorBI] Initializing customizations...
[AeronavigatorBI] Loaded and initialized X modules
[AeronavigatorBI] Real-time Streaming initialized
...
```

---

## Альтернативный способ: Docker интеграция

Если DataLens уже запущен в Docker:

```bash
chmod +x scripts/docker-integrate.sh
./scripts/docker-integrate.sh
```

Этот скрипт скопирует кастомизации в контейнеры.

---

## Проверка работоспособности

### В браузере (консоль F12):

```javascript
// Проверка доступности модулей
window.datalens.streaming      // ✅
window.datalens.alerts          // ✅
window.datalens.reports         // ✅
window.datalens.prescriptive    // ✅
window.datalens.flightAnalytics // ✅
// ... и т.д.
```

---

## Решение проблем

### Проблема: Модули не загружаются

**Решение:**
1. Проверьте логи: `docker-compose logs datalens-ui | grep AeronavigatorBI`
2. Убедитесь, что volumes смонтированы: `docker inspect datalens-ui | grep Mounts`
3. Проверьте, что `initializeCustomizations()` вызван в главном файле

### Проблема: Backend API не работает

**Решение:**
1. Проверьте логи: `docker-compose logs datalens-control-api`
2. Убедитесь, что `initialize_customizations(app)` вызван
3. Проверьте зависимости: `pip list | grep apscheduler`

---

**Дата:** 2024-12-23
**Версия:** 1.0.0

