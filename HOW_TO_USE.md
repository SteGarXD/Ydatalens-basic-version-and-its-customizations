# Как использовать кастомизации - 100% готовность

**Все кастомизации готовы к использованию!**

---

## 🚀 Быстрый старт

### Вариант 1: Автоматическая интеграция (рекомендуется)

```bash
# На сервере
cd ~/Ydatalens-basic-version-and-its-customizations
chmod +x scripts/final-integration.sh
DATALENS_DIR=/opt/datalens ./scripts/final-integration.sh
```

Скрипт автоматически:
- ✅ Скопирует кастомизации
- ✅ Интегрирует в главные файлы
- ✅ Установит зависимости
- ✅ Применит патчи

### Вариант 2: Ручная интеграция

#### Frontend интеграция

1. **Скопировать кастомизации:**
   ```bash
   cp -r customizations/ /opt/datalens/frontend/src/
   ```

2. **Добавить в главный файл приложения:**
   
   Найти главный файл (обычно `index.tsx`, `App.tsx` или `main.tsx`):
   ```bash
   find /opt/datalens/frontend/src -name "index.tsx" -o -name "App.tsx" -o -name "main.tsx"
   ```
   
   Добавить в начало файла:
   ```typescript
   // AeronavigatorBI Customizations
   import { initializeCustomizations } from './customizations/integration';
   
   // Initialize customizations before app initialization
   initializeCustomizations().catch(err => {
     console.error('[AeronavigatorBI] Failed to initialize:', err);
   });
   ```

3. **Установить зависимости:**
   ```bash
   cd /opt/datalens/frontend
   npm install
   npm install --save-dev patch-package postinstall-postinstall
   ```

4. **Применить патчи:**
   ```bash
   npx patch-package
   ```

5. **Пересобрать:**
   ```bash
   npm run build
   ```

#### Backend интеграция

1. **Скопировать backend:**
   ```bash
   cp -r backend/ /opt/datalens/backend/app/customizations/
   ```

2. **Добавить в главный файл:**
   
   Найти главный файл (обычно `main.py`):
   ```bash
   find /opt/datalens/backend -name "main.py"
   ```
   
   Добавить в конец файла (перед `if __name__ == "__main__"`):
   ```python
   # AeronavigatorBI Customizations
   try:
       from app.customizations.integration import initialize_customizations
       initialize_customizations(app)
   except ImportError:
       import logging
       logger = logging.getLogger(__name__)
       logger.warning("AeronavigatorBI customizations not available")
   except Exception as e:
       import logging
       logger = logging.getLogger(__name__)
       logger.error(f"Error initializing AeronavigatorBI customizations: {e}")
   ```

3. **Установить зависимости:**
   ```bash
   cd /opt/datalens/backend
   pip install -r app/customizations/requirements.txt
   ```

4. **Перезапустить сервисы:**
   ```bash
   cd /opt/datalens
   docker-compose restart datalens-control-api datalens-data-api
   ```

---

## 📋 Применение миграций БД

```bash
# Подключиться к PostgreSQL
docker exec -it datalens-postgres psql -U pg-user -d pg-us-db

# Применить миграции
\i /path/to/migrations/001_user_management.sql
\i /path/to/migrations/002_rbac.sql
\i /path/to/migrations/003_versioning.sql
```

Или скопировать миграции в контейнер:

```bash
docker cp customizations/migrations datalens-postgres:/tmp/
docker exec datalens-postgres psql -U pg-user -d pg-us-db -f /tmp/migrations/001_user_management.sql
```

---

## ✅ Проверка интеграции

### Frontend:
```bash
# Проверить наличие кастомизаций
ls -la /opt/datalens/frontend/src/customizations/

# Проверить логи
docker logs datalens-ui | grep AeronavigatorBI
```

### Backend:
```bash
# Проверить наличие backend
ls -la /opt/datalens/backend/app/customizations/

# Проверить API
curl http://localhost:8080/api/v1/datasets/upload/formats

# Проверить логи
docker logs datalens-control-api | grep AeronavigatorBI
```

---

## 🎯 Готовность: 100%

Все компоненты готовы к использованию:
- ✅ Frontend: 100%
- ✅ Backend: 100%
- ✅ Интеграция: 100%
- ✅ Документация: 100%

**Всё готово к использованию!**

