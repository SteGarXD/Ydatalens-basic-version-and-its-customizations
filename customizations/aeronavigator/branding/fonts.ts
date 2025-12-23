/**
 * Настройки шрифтов для ООО "Аэронавигатор"
 */

export const AERONAVIGATOR_FONTS = {
  primary: 'Roboto, Arial, sans-serif',
  heading: 'Roboto, Arial, sans-serif',
  monospace: 'Consolas, "Courier New", monospace',
  
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * CSS для подключения шрифтов
 */
export const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: ${AERONAVIGATOR_FONTS.primary};
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${AERONAVIGATOR_FONTS.heading};
    font-weight: ${AERONAVIGATOR_FONTS.weights.semibold};
  }
  
  code, pre {
    font-family: ${AERONAVIGATOR_FONTS.monospace};
  }
`;

export default AERONAVIGATOR_FONTS;

