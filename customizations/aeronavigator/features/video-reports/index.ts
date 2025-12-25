/**
 * Video Reports Module
 * Автоматическая генерация видео-отчетов из дашбордов
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface VideoReportConfig {
  dashboardId: string;
  duration: number; // секунды
  transitions: 'fade' | 'slide' | 'none';
  includeNarration: boolean;
  language: 'ru' | 'en';
}

/**
 * Генерация видео-отчета из дашборда
 */
export const generateVideoReport = async (
  config: VideoReportConfig
): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.VIDEO_REPORTS) {
    throw new Error('Video reports are disabled');
  }

  try {
    // Отправка запроса на backend для генерации видео
    const response = await fetch('/api/v1/video-reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to generate video report');
    }

    const result = await response.json();
    console.log(`[VideoReports] Video report generated: ${result.video_url}`);
    return result.video_url;
  } catch (error) {
    console.error('[VideoReports] Error generating video:', error);
    throw error;
  }
};

/**
 * Создание скриншотов виджетов для видео
 */
export const captureWidgetScreenshots = async (
  widgetIds: string[]
): Promise<string[]> => {
  if (!AERONAVIGATOR_FEATURES.VIDEO_REPORTS) {
    throw new Error('Video reports are disabled');
  }

  const screenshots: string[] = [];

  for (const widgetId of widgetIds) {
    try {
      const widget = document.getElementById(widgetId);
      if (widget) {
        // Использование html2canvas для создания скриншота
        const html2canvas = await import('html2canvas');
        const canvas = await html2canvas.default(widget);
        const dataUrl = canvas.toDataURL('image/png');
        screenshots.push(dataUrl);
      }
    } catch (error) {
      console.warn(`[VideoReports] Failed to capture widget ${widgetId}:`, error);
    }
  }

  return screenshots;
};

/**
 * Создание нарезки для видео
 */
export const createVideoNarration = async (
  text: string,
  language: 'ru' | 'en' = 'ru'
): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.VIDEO_REPORTS) {
    throw new Error('Video reports are disabled');
  }

  try {
    // Использование Web Speech API для синтеза речи
    if ('speechSynthesis' in window) {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'ru' ? 'ru-RU' : 'en-US';
        utterance.onend = () => resolve('narration_complete');
        utterance.onerror = (error) => reject(error);
        speechSynthesis.speak(utterance);
      });
    } else {
      // Fallback: отправка на backend для генерации аудио
      const response = await fetch('/api/v1/video-reports/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate narration');
      }

      const result = await response.json();
      return result.audio_url;
    }
  } catch (error) {
    console.error('[VideoReports] Error creating narration:', error);
    throw error;
  }
};

/**
 * Инициализация Video Reports
 */
export const initializeVideoReports = async () => {
  if (!AERONAVIGATOR_FEATURES.VIDEO_REPORTS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.video) {
        datalens.video = {
          generate: generateVideoReport,
          captureScreenshots: captureWidgetScreenshots,
          createNarration: createVideoNarration,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Video Reports initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Video Reports:', error);
  }
};

export default initializeVideoReports;

