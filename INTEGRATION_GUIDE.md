# Руководство по интеграции кастомизаций DataLens

Это руководство описывает процесс интеграции кастомизаций DataLens в работающий сервис на bi.aeronavigator.ru.

## Предварительные требования

1. **Доступ к серверу** bi.aeronavigator.ru
2. **Git установлен** на сервере
3. **DataLens установлен** и работает
4. **Права доступа** для модификации файлов DataLens

## Архитектура интеграции

```
GitHub SteGarXD
├── datalens-customizations (этот репозиторий)
└── datalens-basic (базовая платформа)

Сервер bi.aeronavigator.ru
├── /opt/datalens/ (базовая платформа с Git)
│   ├── frontend/
│   ├── backend/
│   └── .git/
└── /opt/datalens-customizations/ (кастомизации)
    └── customizations/
```

## Этап 1: Подготовка репозитория кастомизаций

### 1.1 Клонирование репозитория на сервер

```bash
# На сервере
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations
```

### 1.2 Проверка структуры

Убедитесь, что структура кастомизаций корректна:

```bash
ls -la customizations/
ls -la backend/
ls -la scripts/
```

## Этап 2: Инициализация Git для базовой платформы

**Важно:** Этот этап выполняется на сервере после первого push кастомизаций.

### 2.1 Поиск директории DataLens

```bash
# Найти директорию DataLens
find /opt /usr/local /home -name "datalens" -type d 2>/dev/null

# Или проверить Docker контейнеры
docker ps | grep datalens
docker inspect <container_id> | grep -i source
```

### 2.2 Инициализация Git репозитория

```bash
# Перейти в директорию DataLens
cd /opt/datalens  # или найденная директория

# Инициализировать Git (если нет)
git init

# Создать .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd

# Build outputs
dist/
build/
*.log

# Environment
.env
.env.local
.env.*.local

# DataLens specific
data/
logs/
*.db
*.sqlite
EOF

# Добавить все файлы
git add .

# Создать первый commit
git commit -m "Initial commit: Yandex DataLens base platform for Aeronavigator

- Base DataLens installation
- Date: $(date +%Y-%m-%d)"
```

### 2.3 Создание репозитория на GitHub

1. Репозиторий `datalens-basic` уже создан на GitHub (SteGarXD)
2. Настройте remote:

```bash
git remote add origin https://github.com/SteGarXD/datalens-basic.git
git branch -M main
git push -u origin main
```

### 2.4 Создание ветки для кастомизаций

```bash
git checkout -b aeronavigator-customizations
git push -u origin aeronavigator-customizations
```

## Этап 3: Интеграция Frontend кастомизаций

### 3.1 Применение кастомизаций

```bash
# На сервере
cd /opt/datalens-customizations
chmod +x scripts/apply-customizations.sh
DATALENS_DIR=/opt/datalens ./scripts/apply-customizations.sh
```

### 3.2 Интеграция в главный файл приложения

Найдите главный файл приложения DataLens (обычно `frontend/src/index.tsx` или `frontend/src/App.tsx`) и добавьте:

```typescript
// В начале файла
import { loadCustomizations } from './customizations';

// Перед инициализацией приложения
loadCustomizations().then(() => {
  // Инициализация приложения DataLens
  ReactDOM.render(<App />, document.getElementById('root'));
});
```

### 3.3 Добавление зависимостей

Обновите `package.json` в `frontend/`:

```json
{
  "dependencies": {
    // ... существующие зависимости
    "patch-package": "^8.0.0",
    "postinstall-postinstall": "^2.1.0"
  },
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

Затем:

```bash
cd /opt/datalens/frontend
npm install
```

### 3.4 Интеграция брендинга

1. Скопировать логотип:
```bash
cp /opt/datalens-customizations/../meridian-demo/OP-compass.png \
   /opt/datalens/frontend/public/OP-compass.png
```

2. Применить CSS переопределения:
```bash
# Скопировать CSS файлы
cp /opt/datalens-customizations/customizations/aeronavigator/branding/css-overrides.scss \
   /opt/datalens/frontend/src/styles/aeronavigator-overrides.scss
```

3. Импортировать в главный CSS файл:
```scss
// В frontend/src/index.scss или главном CSS файле
@import './styles/aeronavigator-overrides';
```

## Этап 4: Интеграция Backend кастомизаций

### 4.1 Установка зависимостей

```bash
cd /opt/datalens/backend
pip install -r /opt/datalens-customizations/backend/requirements.txt
```

### 4.2 Интеграция API endpoints

Скопируйте файлы:

```bash
# Создать директорию для кастомных API
mkdir -p /opt/datalens/backend/app/api/v1/custom

# Скопировать файлы
cp /opt/datalens-customizations/backend/file_upload_api.py \
   /opt/datalens/backend/app/api/v1/custom/file_upload.py

cp /opt/datalens-customizations/backend/file_upload_service.py \
   /opt/datalens/backend/app/services/file_upload_service.py
```

### 4.3 Регистрация роутера

В файле `/opt/datalens/backend/app/api/v1/__init__.py` или главном файле роутера:

```python
from .custom.file_upload import router as file_upload_router

app.include_router(file_upload_router, prefix="/api/v1", tags=["file-upload"])
```

### 4.4 Настройка подключения к ClickHouse

Убедитесь, что в конфигурации DataLens настроено подключение к ClickHouse для file upload service.

## Этап 5: Применение миграций БД

### 5.1 Создание миграций

Миграции находятся в `customizations/migrations/`. Примените их к базе данных DataLens:

```bash
# Для PostgreSQL (если используется)
psql -U datalens_user -d datalens_db < \
  /opt/datalens-customizations/customizations/migrations/001_user_management.sql

psql -U datalens_user -d datalens_db < \
  /opt/datalens-customizations/customizations/migrations/002_rbac.sql

psql -U datalens_user -d datalens_db < \
  /opt/datalens-customizations/customizations/migrations/003_versioning.sql
```

## Этап 6: Пересборка и перезапуск

### 6.1 Пересборка frontend

```bash
cd /opt/datalens/frontend
npm run build
```

### 6.2 Перезапуск сервисов

```bash
# Если используется systemd
sudo systemctl restart datalens-frontend
sudo systemctl restart datalens-backend

# Или если используется Docker
docker-compose restart frontend backend
```

## Этап 7: Проверка интеграции

### 7.1 Проверка frontend

1. Откройте браузер и перейдите на bi.aeronavigator.ru
2. Проверьте:
   - Логотип заменен на OP-compass.png
   - Цвета соответствуют брендбуку
   - Все модули загружаются

### 7.2 Проверка backend

```bash
# Проверить API endpoints
curl http://bi.aeronavigator.ru/api/v1/file-upload/health

# Проверить логи
tail -f /opt/datalens/logs/backend.log
```

### 7.3 Проверка функций

- [ ] User Management работает
- [ ] RBAC работает
- [ ] File Upload работает
- [ ] Экспорт в PDF/PPT работает
- [ ] Все модули загружаются без ошибок

## Этап 8: Настройка процесса обновлений

### 8.1 Использование скрипта обновления

```bash
cd /opt/datalens-customizations
chmod +x scripts/update-datalens.sh
DATALENS_DIR=/opt/datalens ./scripts/update-datalens.sh
```

### 8.2 Автоматические обновления

Настройте cron для автоматических обновлений:

```bash
# Добавить в crontab
0 2 * * 0 /opt/datalens-customizations/scripts/update-datalens.sh >> /var/log/datalens-update.log 2>&1
```

## Решение проблем

### Проблема: Кастомизации не загружаются

**Решение:**
1. Проверьте, что `loadCustomizations()` вызывается в главном файле
2. Проверьте консоль браузера на ошибки
3. Убедитесь, что все зависимости установлены

### Проблема: Конфликты при обновлении

**Решение:**
1. Используйте `git stash` для сохранения изменений
2. Разрешите конфликты вручную
3. Примените кастомизации заново

### Проблема: Backend API не работает

**Решение:**
1. Проверьте, что роутер зарегистрирован
2. Проверьте логи backend
3. Убедитесь, что зависимости установлены

## Дополнительные ресурсы

- `UPDATE_GUIDE.md` - руководство по обновлениям
- `DEPLOYMENT.md` - руководство по деплою
- `GIT_WORKFLOW.md` - Git workflow для обновлений
- `PATCH_GUIDE.md` - руководство по патчам

## Поддержка

При возникновении проблем:
1. Проверьте логи: `/opt/datalens/logs/`
2. Проверьте статус сервисов
3. Обратитесь к документации в репозитории

