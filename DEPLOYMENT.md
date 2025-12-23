# Руководство по деплою кастомизаций DataLens

Это руководство описывает процесс деплоя кастомизаций DataLens на сервер bi.aeronavigator.ru.

## Предварительные требования

- [ ] DataLens установлен и работает
- [ ] Git репозиторий базовой платформы инициализирован
- [ ] Репозиторий кастомизаций клонирован на сервер
- [ ] Права доступа настроены

## Быстрый старт

### Автоматический деплой

```bash
# На сервере
cd /opt/datalens-customizations
chmod +x scripts/apply-customizations.sh
DATALENS_DIR=/opt/datalens ./scripts/apply-customizations.sh
```

### Ручной деплой

См. детальные инструкции ниже.

## Структура деплоя

```
/opt/datalens/                    # Базовая платформа DataLens
├── frontend/
│   ├── src/
│   │   └── customizations/      # ← Кастомизации копируются сюда
│   └── public/
│       └── OP-compass.png        # ← Логотип
├── backend/
│   └── app/
│       └── customizations/       # ← Backend кастомизации
└── .git/                         # Git репозиторий базовой платформы

/opt/datalens-customizations/     # Репозиторий кастомизаций
├── customizations/               # Исходные кастомизации
├── backend/                      # Backend сервисы
└── scripts/                      # Скрипты деплоя
```

## Процесс деплоя

### Шаг 1: Подготовка сервера

```bash
# 1. Создать директорию для кастомизаций
sudo mkdir -p /opt/datalens-customizations
sudo chown $USER:$USER /opt/datalens-customizations

# 2. Клонировать репозиторий
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations

# 3. Установить права на скрипты
chmod +x scripts/*.sh
```

### Шаг 2: Резервное копирование

```bash
# Создать резервную копию текущего состояния
BACKUP_DIR="/opt/datalens-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Скопировать кастомизации (если уже были применены)
cp -r /opt/datalens/frontend/src/customizations "$BACKUP_DIR/" 2>/dev/null || true
cp -r /opt/datalens/backend/app/customizations "$BACKUP_DIR/" 2>/dev/null || true

echo "Backup created at: $BACKUP_DIR"
```

### Шаг 3: Применение кастомизаций

```bash
# Установить переменную окружения
export DATALENS_DIR=/opt/datalens

# Применить кастомизации
./scripts/apply-customizations.sh
```

### Шаг 4: Интеграция в код DataLens

#### 4.1 Frontend интеграция

Найти главный файл приложения:

```bash
# Обычно это один из этих файлов:
ls /opt/datalens/frontend/src/index.tsx
ls /opt/datalens/frontend/src/App.tsx
ls /opt/datalens/frontend/src/main.tsx
```

Добавить загрузку кастомизаций в начало файла:

```typescript
// Импорт кастомизаций
import { loadCustomizations } from './customizations';

// Загрузить кастомизации перед инициализацией
loadCustomizations().then(() => {
  // Существующий код инициализации приложения
});
```

#### 4.2 Backend интеграция

Регистрировать роутеры в главном файле API:

```python
# В /opt/datalens/backend/app/api/v1/__init__.py
from .custom.file_upload import router as file_upload_router

app.include_router(file_upload_router, prefix="/api/v1", tags=["file-upload"])
```

### Шаг 5: Установка зависимостей

#### 5.1 Frontend зависимости

```bash
cd /opt/datalens/frontend

# Установить зависимости кастомизаций
npm install --save-dev patch-package postinstall-postinstall

# Установить все зависимости
npm install
```

#### 5.2 Backend зависимости

```bash
cd /opt/datalens/backend

# Установить зависимости из кастомизаций
pip install -r /opt/datalens-customizations/backend/requirements.txt
```

### Шаг 6: Применение патчей

```bash
cd /opt/datalens/frontend
npx patch-package
```

### Шаг 7: Пересборка

```bash
# Frontend
cd /opt/datalens/frontend
npm run build

# Backend (если требуется)
cd /opt/datalens/backend
# Обычно backend не требует пересборки для Python
```

### Шаг 8: Применение миграций БД

```bash
# Для PostgreSQL
export PGPASSWORD='your_password'
psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/001_user_management.sql

psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/002_rbac.sql

psql -U datalens_user -d datalens_db -f \
  /opt/datalens-customizations/customizations/migrations/003_versioning.sql
```

### Шаг 9: Перезапуск сервисов

#### Вариант 1: Systemd

```bash
sudo systemctl restart datalens-frontend
sudo systemctl restart datalens-backend
```

#### Вариант 2: Docker Compose

```bash
cd /opt/datalens
docker-compose restart frontend backend
```

#### Вариант 3: Ручной перезапуск

```bash
# Остановить процессы
pkill -f "datalens-frontend"
pkill -f "datalens-backend"

# Запустить заново (зависит от вашей конфигурации)
```

## Проверка деплоя

### 1. Проверка frontend

```bash
# Проверить, что файлы скопированы
ls -la /opt/datalens/frontend/src/customizations/
ls -la /opt/datalens/frontend/public/OP-compass.png

# Проверить логи
tail -f /opt/datalens/logs/frontend.log
```

### 2. Проверка backend

```bash
# Проверить API
curl http://bi.aeronavigator.ru/api/v1/file-upload/health

# Проверить логи
tail -f /opt/datalens/logs/backend.log
```

### 3. Проверка в браузере

1. Откройте bi.aeronavigator.ru
2. Проверьте:
   - [ ] Логотип заменен
   - [ ] Цвета применены
   - [ ] Нет ошибок в консоли (F12)
   - [ ] Все модули загружаются

## Откат изменений

Если что-то пошло не так:

```bash
# 1. Восстановить из резервной копии
BACKUP_DIR="/opt/datalens-backup-YYYYMMDD-HHMMSS"  # Укажите вашу дату
cp -r "$BACKUP_DIR/customizations" /opt/datalens/frontend/src/
cp -r "$BACKUP_DIR/customizations" /opt/datalens/backend/app/

# 2. Пересобрать
cd /opt/datalens/frontend
npm run build

# 3. Перезапустить
sudo systemctl restart datalens-frontend datalens-backend
```

## Автоматизация деплоя

### CI/CD через GitHub Actions

Репозиторий уже настроен с GitHub Actions workflows:
- `.github/workflows/deploy.yml` - автоматический деплой при push в main
- `.github/workflows/update-datalens.yml` - автоматическое обновление

### Webhook для автоматического деплоя

Настройте webhook на сервере для автоматического деплоя при push:

```bash
# Создать скрипт webhook
cat > /opt/datalens-customizations/webhook-deploy.sh << 'EOF'
#!/bin/bash
cd /opt/datalens-customizations
git pull origin main
./scripts/apply-customizations.sh
EOF

chmod +x /opt/datalens-customizations/webhook-deploy.sh
```

## Мониторинг

### Логи для мониторинга

```bash
# Frontend логи
tail -f /opt/datalens/logs/frontend.log

# Backend логи
tail -f /opt/datalens/logs/backend.log

# Логи деплоя
tail -f /var/log/datalens-deploy.log
```

### Метрики для проверки

- Время загрузки страницы
- Количество ошибок в консоли
- Время ответа API
- Использование памяти

## Безопасность

### Рекомендации

1. **Права доступа:**
   ```bash
   chmod 755 /opt/datalens-customizations/scripts/*.sh
   chmod 644 /opt/datalens/frontend/src/customizations/**/*
   ```

2. **Секреты:**
   - Не коммитьте `.env` файлы
   - Используйте переменные окружения
   - Храните секреты в безопасном месте

3. **Резервные копии:**
   - Регулярно создавайте резервные копии
   - Храните их в безопасном месте

## Обновление кастомизаций

После обновления кастомизаций в репозитории:

```bash
cd /opt/datalens-customizations
git pull origin main
./scripts/apply-customizations.sh
cd /opt/datalens/frontend
npm run build
sudo systemctl restart datalens-frontend datalens-backend
```

## Поддержка

При проблемах с деплоем:
1. Проверьте логи
2. Проверьте права доступа
3. Убедитесь, что все зависимости установлены
4. Обратитесь к `INTEGRATION_GUIDE.md` для детальной информации

