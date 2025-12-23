# Настройка единого репозитория

## Структура репозитория

**Репозиторий:** https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git

### Ветки:

1. **`main` или `base`** - Базовая версия Yandex DataLens (работающая на сервере)
2. **`customizations`** - Все кастомизации и улучшения

## Этап 1: Подготовка базовой ветки на сервере

### 1.1 Клонировать репозиторий на сервере

```bash
# На сервере Linux Ubuntu
cd /opt
git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
cd Ydatalens-basic-version-and-its-customizations
```

### 1.2 Инициализировать базовую ветку

```bash
# Найти директорию DataLens
export DATALENS_DIR="/opt/datalens"  # Или найденный путь

# Скопировать базовую версию DataLens в репозиторий
cd /opt/Ydatalens-basic-version-and-its-customizations

# Создать ветку base (или использовать main)
git checkout -b base

# Скопировать файлы DataLens
cp -r "$DATALENS_DIR"/* . 2>/dev/null || true
cp -r "$DATALENS_DIR"/.* . 2>/dev/null || true

# Создать .gitignore если его нет
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

# Добавить файлы
git add .

# Создать первый commit
git commit -m "Initial commit: Base Yandex DataLens installation

- Base DataLens from server
- Version: [определить версию]
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR"

# Push базовой ветки
git push -u origin base
```

## Этап 2: Подготовка ветки кастомизаций

### 2.1 Переключиться на ветку кастомизаций

```bash
# На сервере или локально
cd /opt/Ydatalens-basic-version-and-its-customizations

# Создать ветку кастомизаций от базовой
git checkout -b customizations

# Или создать пустую ветку
git checkout --orphan customizations
git rm -rf .  # Удалить все файлы базовой версии
```

### 2.2 Скопировать кастомизации из datalens-customizations

```bash
# Клонировать репозиторий кастомизаций (если еще не клонирован)
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git

# Скопировать структуру кастомизаций
cd Ydatalens-basic-version-and-its-customizations
cp -r ../datalens-customizations/customizations ./
cp -r ../datalens-customizations/backend ./
cp -r ../datalens-customizations/scripts ./
cp -r ../datalens-customizations/.github ./
cp ../datalens-customizations/*.md ./
cp ../datalens-customizations/package.json ./
cp ../datalens-customizations/.gitignore ./
cp ../datalens-customizations/.gitattributes ./

# Добавить файлы
git add .

# Создать commit
git commit -m "Add customizations and improvements

- All customizations from datalens-customizations repository
- Frontend modules
- Backend services
- Database migrations
- Scripts and documentation"

# Push ветки кастомизаций
git push -u origin customizations
```

## Этап 3: Объединение веток (когда все готово)

### 3.1 Создать ветку для объединения

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations

# Переключиться на базовую ветку
git checkout base

# Создать ветку для объединения
git checkout -b integration

# Объединить кастомизации
git merge customizations --no-ff -m "Merge customizations into base DataLens

- Integrate all customizations
- Apply improvements
- Test before merging to main"
```

### 3.2 Применить кастомизации к базовой версии

```bash
# Использовать скрипт применения
cd /opt/Ydatalens-basic-version-and-its-customizations
chmod +x scripts/apply-customizations.sh

# Применить кастомизации (скрипт скопирует файлы в нужные места)
export DATALENS_DIR="$(pwd)"
./scripts/apply-customizations.sh
```

### 3.3 Интегрировать в код

#### Frontend интеграция

```bash
# Найти главный файл
cd frontend/src
MAIN_FILE=$(ls index.tsx App.tsx main.tsx index.ts 2>/dev/null | head -1)

# Отредактировать файл и добавить:
# import { loadCustomizations } from './customizations';
# loadCustomizations().then(() => { /* код */ });
```

#### Backend интеграция

```bash
# Найти файл API
cd backend
API_FILE=$(find . -name "__init__.py" -path "*/api/*" | head -1)

# Отредактировать и добавить регистрацию роутеров
```

### 3.4 Закоммитить объединенную версию

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations

# Добавить изменения
git add .

# Создать commit
git commit -m "Integrate customizations into base DataLens

- Applied all customizations
- Integrated frontend modules
- Integrated backend services
- Ready for testing"

# Push ветки integration
git push -u origin integration
```

## Этап 4: Тестирование

### 4.1 Локальное тестирование

```bash
# Установить зависимости
cd frontend
npm install
cd ../backend
pip install -r requirements.txt

# Применить миграции БД
psql -U datalens_user -d datalens_db -f customizations/migrations/001_user_management.sql
psql -U datalens_user -d datalens_db -f customizations/migrations/002_rbac.sql
psql -U datalens_user -d datalens_db -f customizations/migrations/003_versioning.sql

# Пересобрать
cd frontend
npm run build

# Запустить (зависит от вашей конфигурации)
```

### 4.2 Проверка функциональности

- [ ] Логотип заменен
- [ ] Цвета применены
- [ ] Все модули загружаются
- [ ] API endpoints работают
- [ ] Нет ошибок в консоли

## Этап 5: Слияние в main (после успешного тестирования)

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations

# Переключиться на main
git checkout main

# Объединить integration
git merge integration --no-ff -m "Release: DataLens with customizations

- Base DataLens integrated with all customizations
- All features tested and working
- Ready for production"

# Push в main
git push origin main
```

## Структура после объединения

```
Ydatalens-basic-version-and-its-customizations/
├── frontend/                    # Базовая версия DataLens
│   └── src/
│       └── customizations/     # Кастомизации
├── backend/                     # Базовая версия DataLens
│   └── app/
│       └── customizations/     # Backend кастомизации
├── customizations/              # Исходные кастомизации
├── scripts/                     # Скрипты деплоя
└── ...                          # Остальные файлы DataLens
```

## Работа с ветками

### Просмотр веток

```bash
git branch -a
```

### Переключение между ветками

```bash
git checkout base          # Базовая версия
git checkout customizations # Только кастомизации
git checkout integration    # Объединенная версия
git checkout main           # Финальная версия
```

### Обновление кастомизаций

```bash
# Обновить кастомизации из отдельного репозитория
cd /opt/datalens-customizations
git pull origin main

# Скопировать в единый репозиторий
cd /opt/Ydatalens-basic-version-and-its-customizations
git checkout customizations
# Скопировать файлы
git add .
git commit -m "Update customizations"
git push origin customizations
```

## Преимущества единого репозитория

1. ✅ Все в одном месте
2. ✅ Легко отслеживать изменения
3. ✅ Простое объединение через merge
4. ✅ История изменений сохраняется
5. ✅ Легко откатывать изменения

## Дополнительные ресурсы

- `INTEGRATION_GUIDE.md` - подробное руководство по интеграции
- `DEPLOYMENT.md` - руководство по деплою
- `SERVER_SETUP.md` - инструкции для сервера

