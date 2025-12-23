/**
 * Встраивание в корпоративный стиль портала
 * Полная кастомизация iframe и интеграция с Meridian Demo
 */

import React from 'react';

export interface PortalIntegrationConfig {
  portalUrl: string;
  theme: 'light' | 'dark';
  customStyles?: string;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

/**
 * Применить стили портала к iframe
 */
export const applyPortalStyles = (
  iframe: HTMLIFrameElement,
  config: PortalIntegrationConfig
) => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Удалить старые стили
    const oldStyle = iframeDoc.getElementById('portal-custom-styles');
    if (oldStyle) {
      oldStyle.remove();
    }

    // Создать новые стили
    const style = iframeDoc.createElement('style');
    style.id = 'portal-custom-styles';
    style.textContent = `
      ${config.customStyles || ''}
      
      ${config.hideHeader ? `
        .dl-header, .yc-header, [class*="header"] {
          display: none !important;
        }
      ` : ''}
      
      ${config.hideFooter ? `
        .dl-footer, .yc-footer, [class*="footer"] {
          display: none !important;
        }
      ` : ''}
      
      ${config.theme === 'dark' ? `
        body {
          background-color: #1a1a1a;
          color: #ffffff;
        }
      ` : ''}
    `;
    
    iframeDoc.head.appendChild(style);
  } catch (error) {
    console.error('Error applying portal styles:', error);
  }
};

/**
 * Компонент для встраивания в портал
 */
export const PortalEmbeddedDashboard: React.FC<{
  dashboardId: string;
  config: PortalIntegrationConfig;
}> = ({ dashboardId, config }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', () => {
        if (iframeRef.current) {
          applyPortalStyles(iframeRef.current, config);
        }
      });
    }
  }, [config]);

  return (
    <iframe
      ref={iframeRef}
      src={`${config.portalUrl}/dashboards/${dashboardId}`}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
      allowFullScreen
    />
  );
};

export default {
  applyPortalStyles,
  PortalEmbeddedDashboard,
};

