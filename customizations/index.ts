/**
 * Главный файл для загрузки всех кастомизаций
 * Использует feature flags для условной загрузки модулей
 * 
 * @deprecated Используйте initializeCustomizations из integration.ts
 */

import { AERONAVIGATOR_FEATURES } from './aeronavigator/config';
import { initializeCustomizations } from './integration';

/**
 * Загружает все кастомизации на основе feature flags
 * @deprecated Используйте initializeCustomizations из integration.ts
 */
export const loadCustomizations = async () => {
  // Перенаправляем на новую функцию интеграции
  return initializeCustomizations();
  // Брендинг загружается всегда
  if (AERONAVIGATOR_FEATURES.BRANDING) {
    await import('./aeronavigator/branding/theme');
  }
  
  // Основные функции
  if (AERONAVIGATOR_FEATURES.USER_MANAGEMENT) {
    await import('./aeronavigator/features/user-management');
  }
  
  if (AERONAVIGATOR_FEATURES.RBAC) {
    await import('./aeronavigator/features/rbac');
  }
  
  if (AERONAVIGATOR_FEATURES.LDAP_AUTH) {
    await import('./aeronavigator/features/ldap-auth');
  }
  
  if (AERONAVIGATOR_FEATURES.CROSS_FILTERING) {
    await import('./aeronavigator/features/cross-filtering');
  }
  
  // Экспорт
  if (AERONAVIGATOR_FEATURES.PDF_EXPORT) {
    await import('./aeronavigator/features/pdf-export');
  }
  
  if (AERONAVIGATOR_FEATURES.PPT_EXPORT) {
    await import('./aeronavigator/features/ppt-export');
  }
  
  if (AERONAVIGATOR_FEATURES.MARKDOWN_EXPORT) {
    await import('./aeronavigator/features/markdown-export');
  }
  
  // API и интеграции
  if (AERONAVIGATOR_FEATURES.API_AUTOMATION) {
    await import('./aeronavigator/features/api-automation');
  }
  
  if (AERONAVIGATOR_FEATURES.SECURE_EMBEDDING) {
    await import('./aeronavigator/features/secure-embedding');
  }
  
  // Версионирование
  if (AERONAVIGATOR_FEATURES.VERSIONING) {
    await import('./aeronavigator/features/versioning');
  }
  
  if (AERONAVIGATOR_FEATURES.AUTO_SAVE) {
    await import('./aeronavigator/features/auto-save');
  }
  
  // Виджеты
  if (AERONAVIGATOR_FEATURES.CUSTOM_WIDGETS) {
    await import('./aeronavigator/features/custom-widgets');
  }
  
  if (AERONAVIGATOR_FEATURES.DRILL_DOWN) {
    await import('./aeronavigator/features/drill-down');
  }
  
  if (AERONAVIGATOR_FEATURES.PARAMETRIZATION) {
    await import('./aeronavigator/features/parametrization');
  }
  
  if (AERONAVIGATOR_FEATURES.PARENT_CHILD_VIZ) {
    await import('./aeronavigator/features/parent-child-viz');
  }
  
  if (AERONAVIGATOR_FEATURES.COMBO_CHARTS) {
    await import('./aeronavigator/features/combo-charts');
  }
  
  // Коннекторы
  if (AERONAVIGATOR_FEATURES.ADDITIONAL_CONNECTORS) {
    await import('./aeronavigator/features/connectors');
  }
  
  // Данные
  if (AERONAVIGATOR_FEATURES.MATERIALIZATION) {
    await import('./aeronavigator/features/materialization');
  }
  
  if (AERONAVIGATOR_FEATURES.FILE_UPLOAD) {
    await import('./aeronavigator/features/file-upload');
  }
  
  // UI/UX
  if (AERONAVIGATOR_FEATURES.CATALOG) {
    await import('./aeronavigator/features/catalog');
  }
  
  if (AERONAVIGATOR_FEATURES.SEARCH) {
    await import('./aeronavigator/features/search');
  }
  
  if (AERONAVIGATOR_FEATURES.COMMENTS) {
    await import('./aeronavigator/features/comments');
  }
  
  if (AERONAVIGATOR_FEATURES.I18N) {
    await import('./aeronavigator/features/i18n');
  }
  
  if (AERONAVIGATOR_FEATURES.RESPONSIVE) {
    await import('./aeronavigator/features/responsive');
  }
  
  if (AERONAVIGATOR_FEATURES.QL_CHARTS) {
    await import('./aeronavigator/features/ql-charts');
  }
  
  // Специфичные функции
  if (AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    await import('./aeronavigator/flight-analytics');
  }
  
  if (AERONAVIGATOR_FEATURES.MERIDIAN_INTEGRATION) {
    await import('./aeronavigator/integrations/meridian');
  }
};

// Экспорт конфигурации
export { AERONAVIGATOR_FEATURES, AERONAVIGATOR_BRANDING } from './aeronavigator/config';
export { default as AeronavigatorLogo } from './aeronavigator/branding/logo';
export { AERONAVIGATOR_THEME, THEME_CSS } from './aeronavigator/branding/theme';

