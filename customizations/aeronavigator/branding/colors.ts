/**
 * Цветовая схема ООО "Аэронавигатор"
 * Переопределение цветов DataLens
 */

export const AERONAVIGATOR_COLORS = {
  // Основные цвета
  primary: '#1a73e8',
  secondary: '#34a853',
  accent: '#fbbc04',
  error: '#ea4335',
  warning: '#fbbc04',
  success: '#34a853',
  info: '#4285f4',
  
  // Текст
  textPrimary: '#1a1a1a',
  textSecondary: '#5f6368',
  textDisabled: '#9aa0a6',
  
  // Фон
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#e8eaed',
  
  // Границы
  border: '#dadce0',
  borderLight: '#e8eaed',
  borderDark: '#bdc1c6',
  
  // Ховер и активные состояния
  hover: '#f1f3f4',
  active: '#e8eaed',
  selected: '#e8f0fe',
  
  // Таблицы и графики
  chartColors: [
    '#1a73e8',
    '#34a853',
    '#fbbc04',
    '#ea4335',
    '#4285f4',
    '#9c27b0',
    '#00bcd4',
    '#ff9800',
  ],
  
  // Условное форматирование (без градиентов)
  conditionalFormatting: {
    high: '#52c41a',    // Зеленый
    medium: '#faad14',  // Желтый
    low: '#ff4d4f',     // Красный
  },
} as const;

/**
 * CSS переменные для переопределения стилей DataLens
 */
export const CSS_VARIABLES = `
  :root {
    --dl-color-primary: ${AERONAVIGATOR_COLORS.primary};
    --dl-color-secondary: ${AERONAVIGATOR_COLORS.secondary};
    --dl-color-accent: ${AERONAVIGATOR_COLORS.accent};
    --dl-color-error: ${AERONAVIGATOR_COLORS.error};
    --dl-color-warning: ${AERONAVIGATOR_COLORS.warning};
    --dl-color-success: ${AERONAVIGATOR_COLORS.success};
    --dl-color-info: ${AERONAVIGATOR_COLORS.info};
    
    --dl-text-primary: ${AERONAVIGATOR_COLORS.textPrimary};
    --dl-text-secondary: ${AERONAVIGATOR_COLORS.textSecondary};
    --dl-text-disabled: ${AERONAVIGATOR_COLORS.textDisabled};
    
    --dl-background: ${AERONAVIGATOR_COLORS.background};
    --dl-background-secondary: ${AERONAVIGATOR_COLORS.backgroundSecondary};
    --dl-background-tertiary: ${AERONAVIGATOR_COLORS.backgroundTertiary};
    
    --dl-border: ${AERONAVIGATOR_COLORS.border};
    --dl-border-light: ${AERONAVIGATOR_COLORS.borderLight};
    --dl-border-dark: ${AERONAVIGATOR_COLORS.borderDark};
    
    --dl-hover: ${AERONAVIGATOR_COLORS.hover};
    --dl-active: ${AERONAVIGATOR_COLORS.active};
    --dl-selected: ${AERONAVIGATOR_COLORS.selected};
  }
`;

export default AERONAVIGATOR_COLORS;

