# Финальные инструкции по настройке

## Текущая ситуация

✅ **Кастомизации (локально):**
- Репозиторий: `datalens-customizations` (локально в D:\ANBI\datalens-customizations)
- Все файлы готовы и закоммичены
- Нужно запушить в GitHub (если еще не запушено)

✅ **Базовая версия DataLens (на сервере):**
- Расположение: Linux Ubuntu VM сервер
- Работает в контейнерах
- Нужно скопировать на сервер и запушить в единый репозиторий

## Шаг 1: Убедиться что кастомизации запушены

### Локально (Windows):

```bash
cd D:\ANBI\datalens-customizations

# Проверить статус
git status
git branch -a

# Если есть незакоммиченные изменения
git add -A
git commit -m "Final commit before server setup"

# Запушить в GitHub
git push -u origin main

# Если репозиторий не существует на GitHub, создать его:
# https://github.com/new
# Имя: datalens-customizations
```

## Шаг 2: На сервере Linux Ubuntu

### 2.1 Подключиться к серверу

```bash
ssh user@bi.aeronavigator.ru
# или
ssh user@<ip-address>
```

### 2.2 Клонировать кастомизации

```bash
cd /opt
git clone https://github.com/SteGarXD/datalens-customizations.git
cd datalens-customizations
chmod +x scripts/*.sh
```

### 2.3 Запустить автоматическую настройку единого репозитория

```bash
# Один скрипт делает всё автоматически!
./scripts/auto-setup-unified-repo.sh
```

Этот скрипт автоматически:
1. ✅ Найдет DataLens на сервере
2. ✅ Клонирует единый репозиторий `Ydatalens-basic-version-and-its-customizations`
3. ✅ Создаст ветку `base` с базовой версией DataLens
4. ✅ Создаст ветку `customizations` со всеми кастомизациями
5. ✅ Объединит их в ветку `integration`
6. ✅ Применит кастомизации
7. ✅ Запушит всё в GitHub

### 2.4 Если нужна ручная настройка

```bash
# Найти DataLens
export DATALENS_DIR="/opt/datalens"  # Или найденный путь

# Клонировать единый репозиторий
cd /opt
git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git
cd Ydatalens-basic-version-and-its-customizations

# Создать ветку base
git checkout -b base
cp -r "$DATALENS_DIR"/* .
cp -r "$DATALENS_DIR"/.[!.]* .
git add .
git commit -m "Base Yandex DataLens from server"
git push -u origin base

# Создать ветку customizations
git checkout -b customizations
# Скопировать кастомизации из /opt/datalens-customizations
cp -r /opt/datalens-customizations/customizations ./
cp -r /opt/datalens-customizations/backend ./
cp -r /opt/datalens-customizations/scripts ./
cp -r /opt/datalens-customizations/.github ./
cp /opt/datalens-customizations/*.md ./
cp /opt/datalens-customizations/package.json ./
git add .
git commit -m "All customizations and improvements"
git push -u origin customizations

# Объединить
git checkout base
git checkout -b integration
git merge customizations --no-ff
./scripts/apply-customizations.sh
git add .
git commit -m "Integrated version"
git push -u origin integration
```

## Шаг 3: Проверка

После выполнения скрипта проверьте на GitHub:

1. Репозиторий: https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations
2. Должны быть ветки:
   - `base` - базовая версия
   - `customizations` - кастомизации
   - `integration` - объединенная версия

## Решение проблемы "no branches available"

Эта ошибка возникает когда:
- Ветки не запушены в remote
- Нет связи с GitHub

**Решение:**

```bash
# Убедиться что есть ветка
git branch

# Если нет ветки main, создать
git checkout -b main

# Убедиться что remote настроен
git remote -v

# Если remote нет, добавить
git remote add origin https://github.com/SteGarXD/datalens-customizations.git

# Запушить ветку
git push -u origin main
```

## Структура после настройки

```
GitHub:
├── SteGarXD/datalens-customizations (кастомизации)
└── SteGarXD/Ydatalens-basic-version-and-its-customizations (единый)
    ├── base (базовая версия с сервера)
    ├── customizations (кастомизации)
    ├── integration (объединенная)
    └── main (финальная после тестирования)
```

## Важно

- ✅ Кастомизации должны быть запушены в `datalens-customizations`
- ✅ Базовая версия будет скопирована с сервера в единый репозиторий
- ✅ Всё объединится автоматически через скрипт `auto-setup-unified-repo.sh`

