/**
 * Тема для ООО "Аэронавигатор"
 * Объединяет цвета, шрифты и другие настройки брендинга
 */

import { AERONAVIGATOR_COLORS, CSS_VARIABLES } from './colors';
import { AERONAVIGATOR_FONTS, FONTS_CSS } from './fonts';
import { AERONAVIGATOR_BRANDING } from '../config';

export const AERONAVIGATOR_THEME = {
  colors: AERONAVIGATOR_COLORS,
  fonts: AERONAVIGATOR_FONTS,
  branding: AERONAVIGATOR_BRANDING,
  
  // Дополнительные настройки темы
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
} as const;

/**
 * Полный CSS для темы
 */
export const THEME_CSS = `
  ${CSS_VARIABLES}
  ${FONTS_CSS}
  
  /* Дополнительные стили для темы */
  .aeronavigator-theme {
    --spacing-xs: ${AERONAVIGATOR_THEME.spacing.xs};
    --spacing-sm: ${AERONAVIGATOR_THEME.spacing.sm};
    --spacing-md: ${AERONAVIGATOR_THEME.spacing.md};
    --spacing-lg: ${AERONAVIGATOR_THEME.spacing.lg};
    --spacing-xl: ${AERONAVIGATOR_THEME.spacing.xl};
    --spacing-2xl: ${AERONAVIGATOR_THEME.spacing['2xl']};
    
    --border-radius-sm: ${AERONAVIGATOR_THEME.borderRadius.sm};
    --border-radius-md: ${AERONAVIGATOR_THEME.borderRadius.md};
    --border-radius-lg: ${AERONAVIGATOR_THEME.borderRadius.lg};
    --border-radius-xl: ${AERONAVIGATOR_THEME.borderRadius.xl};
    --border-radius-full: ${AERONAVIGATOR_THEME.borderRadius.full};
  }
`;

export default AERONAVIGATOR_THEME;

