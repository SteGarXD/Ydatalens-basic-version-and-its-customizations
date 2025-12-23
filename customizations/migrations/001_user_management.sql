-- Миграция 001: User Management
-- Создание таблиц для управления пользователями и группами

-- Таблица пользователей (расширение базовой таблицы DataLens)
CREATE TABLE IF NOT EXISTS aeronavigator_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    -- Связь с базовой таблицей пользователей DataLens (если существует)
    datalens_user_id INTEGER
);

-- Таблица групп
CREATE TABLE IF NOT EXISTS aeronavigator_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь пользователей и групп (many-to-many)
CREATE TABLE IF NOT EXISTS aeronavigator_user_groups (
    user_id INTEGER NOT NULL REFERENCES aeronavigator_users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES aeronavigator_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_aeronavigator_users_username ON aeronavigator_users(username);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_users_email ON aeronavigator_users(email);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_user_groups_user_id ON aeronavigator_user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_user_groups_group_id ON aeronavigator_user_groups(group_id);

-- Комментарии
COMMENT ON TABLE aeronavigator_users IS 'Расширенная таблица пользователей для ООО "Аэронавигатор"';
COMMENT ON TABLE aeronavigator_groups IS 'Группы пользователей';
COMMENT ON TABLE aeronavigator_user_groups IS 'Связь пользователей и групп';

