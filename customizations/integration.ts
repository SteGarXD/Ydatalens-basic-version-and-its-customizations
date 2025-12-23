/**
 * Интеграция кастомизаций с DataLens
 * Этот файл обеспечивает правильную интеграцию кастомизаций в систему DataLens
 */

import { AERONAVIGATOR_FEATURES } from './aeronavigator/config';

/**
 * Интерфейс для интеграции с DataLens
 */
export interface DataLensIntegration {
  /**
   * Инициализация кастомизаций
   * Вызывается при загрузке приложения DataLens
   */
  initialize(): Promise<void>;
  
  /**
   * Применение брендинга
   */
  applyBranding(): Promise<void>;
  
  /**
   * Регистрация модулей
   */
  registerModules(): Promise<void>;
}

/**
 * Главная функция инициализации кастомизаций
 * Должна быть вызвана в главном файле приложения DataLens
 */
export const initializeCustomizations = async (): Promise<void> => {
  try {
    console.log('[AeronavigatorBI] Initializing customizations...');
    
    // 1. Применить брендинг (всегда первым)
    if (AERONAVIGATOR_FEATURES.BRANDING) {
      await applyBranding();
    }
    
    // 2. Загрузить модули через feature flags
    await loadModules();
    
    // 3. Инициализировать интеграции
    if (AERONAVIGATOR_FEATURES.MERIDIAN_INTEGRATION) {
      await import('./aeronavigator/integrations/meridian');
    }
    
    console.log('[AeronavigatorBI] Customizations initialized successfully');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing customizations:', error);
    // Не прерываем загрузку приложения при ошибке в кастомизациях
  }
};

/**
 * Применение брендинга
 */
const applyBranding = async (): Promise<void> => {
  try {
    // Загрузить тему
    const { AERONAVIGATOR_THEME, THEME_CSS } = await import('./aeronavigator/branding/theme');
    
    // Применить CSS
    if (typeof document !== 'undefined') {
      const styleId = 'aeronavigator-theme';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = THEME_CSS;
    }
    
    // Загрузить логотип компонент
    await import('./aeronavigator/branding/logo');
    
    // Применить CSS переопределения
    await import('./aeronavigator/branding/css-overrides.scss');
    
    console.log('[AeronavigatorBI] Branding applied');
  } catch (error) {
    console.error('[AeronavigatorBI] Error applying branding:', error);
  }
};

/**
 * Загрузка модулей на основе feature flags
 */
const loadModules = async (): Promise<void> => {
  const moduleLoaders: Array<() => Promise<any>> = [];
  
  // Основные функции
  if (AERONAVIGATOR_FEATURES.USER_MANAGEMENT) {
    moduleLoaders.push(() => import('./aeronavigator/features/user-management'));
  }
  
  if (AERONAVIGATOR_FEATURES.RBAC) {
    moduleLoaders.push(() => import('./aeronavigator/features/rbac'));
  }
  
  if (AERONAVIGATOR_FEATURES.LDAP_AUTH) {
    moduleLoaders.push(() => import('./aeronavigator/features/ldap-auth'));
  }
  
  if (AERONAVIGATOR_FEATURES.CROSS_FILTERING) {
    moduleLoaders.push(() => import('./aeronavigator/features/cross-filtering'));
  }
  
  // Экспорт
  if (AERONAVIGATOR_FEATURES.PDF_EXPORT) {
    moduleLoaders.push(() => import('./aeronavigator/features/pdf-export'));
  }
  
  if (AERONAVIGATOR_FEATURES.PPT_EXPORT) {
    moduleLoaders.push(() => import('./aeronavigator/features/ppt-export'));
  }
  
  if (AERONAVIGATOR_FEATURES.MARKDOWN_EXPORT) {
    moduleLoaders.push(() => import('./aeronavigator/features/markdown-export'));
  }
  
  // API и интеграции
  if (AERONAVIGATOR_FEATURES.API_AUTOMATION) {
    moduleLoaders.push(() => import('./aeronavigator/features/api-automation'));
  }
  
  if (AERONAVIGATOR_FEATURES.SECURE_EMBEDDING) {
    moduleLoaders.push(() => import('./aeronavigator/features/secure-embedding'));
  }
  
  // Версионирование
  if (AERONAVIGATOR_FEATURES.VERSIONING) {
    moduleLoaders.push(() => import('./aeronavigator/features/versioning'));
  }
  
  if (AERONAVIGATOR_FEATURES.AUTO_SAVE) {
    moduleLoaders.push(() => import('./aeronavigator/features/auto-save'));
  }
  
  // Виджеты
  if (AERONAVIGATOR_FEATURES.CUSTOM_WIDGETS) {
    moduleLoaders.push(() => import('./aeronavigator/features/custom-widgets'));
  }
  
  if (AERONAVIGATOR_FEATURES.DRILL_DOWN) {
    moduleLoaders.push(() => import('./aeronavigator/features/drill-down'));
  }
  
  if (AERONAVIGATOR_FEATURES.PARAMETRIZATION) {
    moduleLoaders.push(() => import('./aeronavigator/features/parametrization'));
  }
  
  if (AERONAVIGATOR_FEATURES.PARENT_CHILD_VIZ) {
    moduleLoaders.push(() => import('./aeronavigator/features/parent-child-viz'));
  }
  
  if (AERONAVIGATOR_FEATURES.COMBO_CHARTS) {
    moduleLoaders.push(() => import('./aeronavigator/features/combo-charts'));
  }
  
  // Коннекторы
  if (AERONAVIGATOR_FEATURES.ADDITIONAL_CONNECTORS) {
    moduleLoaders.push(() => import('./aeronavigator/features/connectors'));
  }
  
  // Данные
  if (AERONAVIGATOR_FEATURES.MATERIALIZATION) {
    moduleLoaders.push(() => import('./aeronavigator/features/materialization'));
  }
  
  if (AERONAVIGATOR_FEATURES.FILE_UPLOAD) {
    moduleLoaders.push(() => import('./aeronavigator/features/file-upload'));
  }
  
  // UI/UX
  if (AERONAVIGATOR_FEATURES.CATALOG) {
    moduleLoaders.push(() => import('./aeronavigator/features/catalog'));
  }
  
  if (AERONAVIGATOR_FEATURES.SEARCH) {
    moduleLoaders.push(() => import('./aeronavigator/features/search'));
  }
  
  if (AERONAVIGATOR_FEATURES.COMMENTS) {
    moduleLoaders.push(() => import('./aeronavigator/features/comments'));
  }
  
  if (AERONAVIGATOR_FEATURES.I18N) {
    moduleLoaders.push(() => import('./aeronavigator/features/i18n'));
  }
  
  if (AERONAVIGATOR_FEATURES.RESPONSIVE) {
    moduleLoaders.push(() => import('./aeronavigator/features/responsive'));
  }
  
  if (AERONAVIGATOR_FEATURES.QL_CHARTS) {
    moduleLoaders.push(() => import('./aeronavigator/features/ql-charts'));
  }
  
  // Специфичные функции
  if (AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    moduleLoaders.push(() => import('./aeronavigator/flight-analytics'));
  }
  
  // Загрузить все модули параллельно
  await Promise.all(moduleLoaders.map(loader => loader().catch(err => {
    console.warn('[AeronavigatorBI] Failed to load module:', err);
    return null;
  })));
  
  console.log(`[AeronavigatorBI] Loaded ${moduleLoaders.length} modules`);
};

/**
 * Экспорт для использования в DataLens
 */
export default {
  initialize: initializeCustomizations,
};

// Автоматическая инициализация при импорте (если нужно)
// initializeCustomizations();

