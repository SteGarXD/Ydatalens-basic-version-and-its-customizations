# Инструкция: Добавление базовой версии в master на сервере

## Текущая ситуация

✅ **Ветка `customizations`** - готова и запушена в GitHub
- Содержит все кастомизации и улучшения
- Запушена из локальной Windows машины

⏳ **Ветка `master`** - нужно добавить на сервере
- Должна содержать базовую версию Yandex DataLens
- Будет добавлена с сервера Linux Ubuntu

## Шаги на сервере

### 1. Клонировать единый репозиторий

```bash
cd /opt
git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
cd Ydatalens-basic-version-and-its-customizations
```

### 2. Найти директорию DataLens

```bash
# Автоматический поиск
find /opt /usr/local /home -name "datalens" -type d 2>/dev/null | head -1

# Или проверка Docker
docker ps | grep datalens

# Установить переменную
export DATALENS_DIR="/opt/datalens"  # Или найденный путь
```

### 3. Создать ветку master с базовой версией

```bash
cd /opt/Ydatalens-basic-version-and-its-customizations

# Переключиться на master (или создать если нет)
git checkout master 2>/dev/null || git checkout -b master

# Очистить директорию (кроме .git)
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Скопировать базовую версию DataLens
cp -r "$DATALENS_DIR"/* .
cp -r "$DATALENS_DIR"/.[!.]* . 2>/dev/null || true

# Создать .gitignore
cat > .gitignore << 'EOF'
node_modules/
__pycache__/
*.pyc
dist/
build/
*.log
.env
.env.*
data/
logs/
*.db
*.sqlite
EOF

# Создать README для master
cat > README.md << 'EOF'
# Базовая версия Yandex DataLens

Это базовая, оригинальная версия Yandex DataLens Open Source.

## Описание

Базовая on-premise версия DataLens без дополнительных функций облачной версии.

## Ветки

- `master` - Базовая версия (эта ветка)
- `customizations` - Все кастомизации и улучшения
EOF

# Добавить и закоммитить
git add .
VERSION=$(cat frontend/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo "unknown")
git commit -m "Base Yandex DataLens installation

- Base DataLens from server
- Version: $VERSION
- Date: $(date +%Y-%m-%d)
- Location: $DATALENS_DIR"

# Запушить в GitHub
git push -u origin master
```

## Результат

После выполнения на GitHub будет:

**Репозиторий:** https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git

**Ветки:**
- ✅ `master` - Базовая версия Yandex DataLens
- ✅ `customizations` - Все кастомизации и улучшения

## Объединение (когда готово)

```bash
# Переключиться на master
git checkout master

# Объединить кастомизации
git merge customizations

# Применить кастомизации
chmod +x scripts/apply-customizations.sh
export DATALENS_DIR="$(pwd)"
./scripts/apply-customizations.sh

# Закоммитить объединенную версию
git add .
git commit -m "Merge customizations into base DataLens"
git push origin master
```

## Автоматический скрипт

Или используйте готовый скрипт:

```bash
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations
chmod +x scripts/setup-two-branches.sh
./scripts/setup-two-branches.sh
```

Скрипт автоматически создаст обе ветки.

