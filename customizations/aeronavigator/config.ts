/**
 * Конфигурация кастомизаций для ООО "Аэронавигатор"
 * Все feature flags и настройки кастомизаций DataLens
 */

export const AERONAVIGATOR_FEATURES = {
  // Основные функции
  USER_MANAGEMENT: true,
  RBAC: true,
  LDAP_AUTH: true,
  CROSS_FILTERING: true,
  
  // Экспорт
  PDF_EXPORT: true,
  PPT_EXPORT: true,
  MARKDOWN_EXPORT: true,
  
  // API и интеграции
  API_AUTOMATION: true,
  SECURE_EMBEDDING: true,
  
  // Версионирование и автосохранение
  VERSIONING: true,
  AUTO_SAVE: true,
  
  // Виджеты и визуализации
  CUSTOM_WIDGETS: true,
  DRILL_DOWN: true,
  PARAMETRIZATION: true,
  PARENT_CHILD_VIZ: true,
  COMBO_CHARTS: true,
  
  // Коннекторы
  ADDITIONAL_CONNECTORS: true,
  
  // Данные
  MATERIALIZATION: true,
  FILE_UPLOAD: true,
  
  // UI/UX
  CATALOG: true,
  SEARCH: true,
  COMMENTS: true,
  I18N: true,
  RESPONSIVE: true,
  QL_CHARTS: true,
  
  // Брендинг
  BRANDING: true,
  DEEP_CSS_CUSTOMIZATION: true,
  PORTAL_INTEGRATION: true,
  
  // Специфичные функции
  FLIGHT_ANALYTICS: true,
  MERIDIAN_INTEGRATION: true,
  
  // S2 Pivot Table от Alibaba
  S2_PIVOT_TABLE: true,
  
  // AI/ML функции (превосходят облачную версию)
  AI_ML: true,
  AUTO_INSIGHTS: true,
  ANOMALY_DETECTION: true,
  PREDICTIVE_ANALYTICS: true,
  NATURAL_LANGUAGE_QUERY: true,
  AUTO_CHART_SUGGESTIONS: true,
  SMART_DASHBOARD_GENERATION: true,
  DATA_STORYTELLING: true,
  
  // Real-time Collaboration (превосходит облачную версию)
  COLLABORATION: true,
  REAL_TIME_EDITING: true,
  PRESENCE_INDICATORS: true,
  LIVE_COMMENTS: true,
  CO_BROWSING: true,
  
  // Расширенные функции производительности
  QUERY_CACHING: true,
  INCREMENTAL_REFRESH: true,
  PARALLEL_PROCESSING: true,
  
  // Расширенная безопасность
  FIELD_LEVEL_SECURITY: true,
  DATA_MASKING: true,
  AUDIT_LOGGING: true,
  
  // Аналитика использования
  USAGE_ANALYTICS: true,
  PERFORMANCE_MONITORING: true,
  
  // Статистические методы (fallback для ML)
  STATISTICAL_METHODS_FALLBACK: true, // Использовать статистические методы как fallback если ML недоступен
} as const;

export const AERONAVIGATOR_BRANDING = {
  logo: '/OP-compass.png',
  companyName: 'ООО "Аэронавигатор"',
  productName: 'AeronavigatorBI',
  primaryColor: '#1a73e8',
  secondaryColor: '#34a853',
  accentColor: '#fbbc04',
  fonts: {
    primary: 'Roboto, Arial, sans-serif',
    heading: 'Roboto, Arial, sans-serif',
  },
} as const;

export const LDAP_CONFIG = {
  enabled: true,
  server: 'ldap://ad.aeronavigator.ru',
  baseDN: 'dc=aeronavigator,dc=ru',
  usernameAttribute: 'sAMAccountName',
  emailAttribute: 'mail',
  groupAttribute: 'memberOf',
  syncInterval: 3600, // секунды
} as const;

export const MATERIALIZATION_CONFIG = {
  enabled: true,
  defaultInterval: 300, // секунды (5 минут)
  clickhouseDatabase: 'datalens_materialized',
  autoCleanup: true,
  cleanupAfterDays: 30,
} as const;

export const AUTO_SAVE_CONFIG = {
  enabled: true,
  interval: 30, // секунды
  showIndicator: true,
  restoreOnLoad: true,
} as const;

export const VERSIONING_CONFIG = {
  enabled: true,
  autoVersion: true,
  maxVersions: 50,
  allowManualVersion: true,
} as const;

export const API_CONFIG = {
  enabled: true,
  basePath: '/api/v1',
  authentication: 'jwt',
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
  },
} as const;

export const SECURE_EMBEDDING_CONFIG = {
  enabled: true,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  tokenExpiry: 3600, // секунды
  allowedOrigins: [
    'https://aeronavigator.ru',
    'https://meridian.aeronavigator.ru',
  ],
} as const;

export const CONNECTORS_CONFIG = {
  googleSheets: {
    enabled: true,
    apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
  },
  yandexMetrica: {
    enabled: true,
    apiKey: process.env.YANDEX_METRICA_API_KEY || '',
  },
  appMetrica: {
    enabled: true,
    apiKey: process.env.APP_METRICA_API_KEY || '',
  },
} as const;

export const FLIGHT_ANALYTICS_CONFIG = {
  enabled: true,
  defaultAggregations: ['sum', 'avg', 'count'],
  customFormulas: {
    zpk_pct: '([zabron] / [pkz]) * 100',
    load_factor: '([passengers] / [capacity]) * 100',
  },
} as const;

export const MERIDIAN_INTEGRATION_CONFIG = {
  enabled: true,
  apiUrl: process.env.MERIDIAN_API_URL || 'https://meridian.aeronavigator.ru',
  syncUsers: true,
  syncInterval: 1800, // секунды (30 минут)
  rlsEnabled: true,
} as const;

/**
 * Конфигурация ML методов
 */
export const ML_CONFIG = {
  // Приоритет методов (1 = высший приоритет)
  methodPriority: {
    backend: 1,      // scikit-learn на backend (самый мощный)
    tensorflow: 2,   // TensorFlow.js в браузере
    statistical: 3,  // Статистические методы (fallback)
  },
  
  // Использовать статистические методы как fallback
  useStatisticalFallback: AERONAVIGATOR_FEATURES.STATISTICAL_METHODS_FALLBACK,
  
  // Минимальное количество данных для ML методов
  minDataPointsForML: {
    tensorflow: 20,
    backend: 20,
    statistical: 3,  // Статистические методы работают с меньшим количеством данных
  },
  
  // Автоматический выбор метода
  autoSelectMethod: true,
  
  // Логирование выбранного метода
  logMethodSelection: process.env.NODE_ENV === 'development',
} as const;

