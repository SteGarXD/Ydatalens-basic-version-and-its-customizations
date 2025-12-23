-- Миграция 002: RBAC (Role-Based Access Control)
-- Создание таблиц для управления ролями и правами доступа

-- Таблица ролей
CREATE TABLE IF NOT EXISTS aeronavigator_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица прав доступа
CREATE TABLE IF NOT EXISTS aeronavigator_permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    resource_type VARCHAR(100) NOT NULL, -- 'dashboard', 'dataset', 'chart', etc.
    action VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь ролей и прав (many-to-many)
CREATE TABLE IF NOT EXISTS aeronavigator_role_permissions (
    role_id INTEGER NOT NULL REFERENCES aeronavigator_roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES aeronavigator_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь пользователей и ролей (many-to-many)
CREATE TABLE IF NOT EXISTS aeronavigator_user_roles (
    user_id INTEGER NOT NULL REFERENCES aeronavigator_users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES aeronavigator_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица доступа к ресурсам (дашборды, датасеты и т.д.)
CREATE TABLE IF NOT EXISTS aeronavigator_resource_access (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL, -- 'dashboard', 'dataset', 'chart'
    resource_id VARCHAR(255) NOT NULL, -- ID ресурса в DataLens
    user_id INTEGER REFERENCES aeronavigator_users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES aeronavigator_groups(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES aeronavigator_roles(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL, -- 'read', 'write', 'admin', 'none'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_type, resource_id, user_id, group_id, role_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_aeronavigator_roles_name ON aeronavigator_roles(name);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_permissions_resource_type ON aeronavigator_permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_user_roles_user_id ON aeronavigator_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_user_roles_role_id ON aeronavigator_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_resource_access_resource ON aeronavigator_resource_access(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_resource_access_user ON aeronavigator_resource_access(user_id);

-- Вставка стандартных ролей
INSERT INTO aeronavigator_roles (name, description) VALUES
    ('admin', 'Администратор - полный доступ ко всем ресурсам'),
    ('analyst', 'Аналитик - создание и редактирование дашбордов и чартов'),
    ('viewer', 'Просмотрщик - только просмотр дашбордов'),
    ('flight_manager', 'Менеджер рейсов - доступ к данным рейсов')
ON CONFLICT (name) DO NOTHING;

-- Вставка стандартных прав
INSERT INTO aeronavigator_permissions (name, description, resource_type, action) VALUES
    ('dashboard:read', 'Просмотр дашбордов', 'dashboard', 'read'),
    ('dashboard:write', 'Создание и редактирование дашбордов', 'dashboard', 'write'),
    ('dashboard:delete', 'Удаление дашбордов', 'dashboard', 'delete'),
    ('dashboard:admin', 'Администрирование дашбордов', 'dashboard', 'admin'),
    ('dataset:read', 'Просмотр датасетов', 'dataset', 'read'),
    ('dataset:write', 'Создание и редактирование датасетов', 'dataset', 'write'),
    ('dataset:delete', 'Удаление датасетов', 'dataset', 'delete'),
    ('chart:read', 'Просмотр чартов', 'chart', 'read'),
    ('chart:write', 'Создание и редактирование чартов', 'chart', 'write'),
    ('chart:delete', 'Удаление чартов', 'chart', 'delete'),
    ('user:admin', 'Управление пользователями', 'user', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Назначение прав ролям
-- Admin - все права
INSERT INTO aeronavigator_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM aeronavigator_roles r, aeronavigator_permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Analyst - чтение и запись дашбордов, чартов, датасетов
INSERT INTO aeronavigator_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM aeronavigator_roles r, aeronavigator_permissions p
WHERE r.name = 'analyst'
  AND (p.name LIKE 'dashboard:%' OR p.name LIKE 'chart:%' OR p.name LIKE 'dataset:%')
  AND p.action IN ('read', 'write')
ON CONFLICT DO NOTHING;

-- Viewer - только чтение
INSERT INTO aeronavigator_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM aeronavigator_roles r, aeronavigator_permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Комментарии
COMMENT ON TABLE aeronavigator_roles IS 'Роли пользователей для RBAC';
COMMENT ON TABLE aeronavigator_permissions IS 'Права доступа к ресурсам';
COMMENT ON TABLE aeronavigator_resource_access IS 'Доступ пользователей/групп/ролей к конкретным ресурсам';

