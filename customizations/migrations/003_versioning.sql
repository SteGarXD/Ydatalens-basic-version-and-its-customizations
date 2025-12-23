-- Миграция 003: Versioning
-- Создание таблиц для версионирования дашбордов и истории изменений

-- Таблица версий дашбордов
CREATE TABLE IF NOT EXISTS aeronavigator_dashboard_versions (
    id SERIAL PRIMARY KEY,
    dashboard_id VARCHAR(255) NOT NULL, -- ID дашборда в DataLens
    version_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    content JSONB, -- Полное содержимое дашборда (виджеты, настройки и т.д.)
    created_by INTEGER REFERENCES aeronavigator_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT, -- Комментарий к версии
    is_current BOOLEAN DEFAULT FALSE, -- Текущая версия
    UNIQUE(dashboard_id, version_number)
);

-- Таблица версий чартов
CREATE TABLE IF NOT EXISTS aeronavigator_chart_versions (
    id SERIAL PRIMARY KEY,
    chart_id VARCHAR(255) NOT NULL, -- ID чарта в DataLens
    version_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    content JSONB, -- Полное содержимое чарта
    created_by INTEGER REFERENCES aeronavigator_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    UNIQUE(chart_id, version_number)
);

-- Таблица истории изменений (для аудита)
CREATE TABLE IF NOT EXISTS aeronavigator_change_history (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL, -- 'dashboard', 'chart', 'dataset'
    resource_id VARCHAR(255) NOT NULL,
    version_id INTEGER, -- Ссылка на версию (если применимо)
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'restore'
    changed_by INTEGER REFERENCES aeronavigator_users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changes JSONB, -- Детали изменений (diff)
    comment TEXT
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_aeronavigator_dashboard_versions_dashboard_id ON aeronavigator_dashboard_versions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_dashboard_versions_current ON aeronavigator_dashboard_versions(dashboard_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_aeronavigator_chart_versions_chart_id ON aeronavigator_chart_versions(chart_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_chart_versions_current ON aeronavigator_chart_versions(chart_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_aeronavigator_change_history_resource ON aeronavigator_change_history(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_aeronavigator_change_history_changed_at ON aeronavigator_change_history(changed_at DESC);

-- Функция для автоматического создания версии при изменении
CREATE OR REPLACE FUNCTION aeronavigator_create_dashboard_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Получить следующий номер версии
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM aeronavigator_dashboard_versions
    WHERE dashboard_id = NEW.dashboard_id;
    
    -- Сбросить флаг текущей версии у всех предыдущих версий
    UPDATE aeronavigator_dashboard_versions
    SET is_current = FALSE
    WHERE dashboard_id = NEW.dashboard_id;
    
    -- Создать новую версию
    INSERT INTO aeronavigator_dashboard_versions (
        dashboard_id, version_number, title, description, content,
        created_by, is_current
    ) VALUES (
        NEW.dashboard_id, next_version, NEW.title, NEW.description, NEW.content,
        NEW.created_by, TRUE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического версионирования (требует настройки на уровне приложения)
-- CREATE TRIGGER trigger_dashboard_version
-- AFTER UPDATE ON datalens_dashboards
-- FOR EACH ROW
-- EXECUTE FUNCTION aeronavigator_create_dashboard_version();

-- Комментарии
COMMENT ON TABLE aeronavigator_dashboard_versions IS 'Версии дашбордов для возможности отката';
COMMENT ON TABLE aeronavigator_chart_versions IS 'Версии чартов для возможности отката';
COMMENT ON TABLE aeronavigator_change_history IS 'История изменений для аудита';

