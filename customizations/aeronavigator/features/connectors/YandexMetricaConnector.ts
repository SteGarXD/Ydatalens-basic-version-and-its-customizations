/**
 * Коннектор к Yandex Metrica
 */

export interface YandexMetricaConfig {
  counterId: string;
  accessToken: string;
  dateFrom: string;
  dateTo: string;
  metrics: string[];
  dimensions?: string[];
}

/**
 * Получить данные из Yandex Metrica
 */
export const fetchYandexMetricaData = async (
  config: YandexMetricaConfig
): Promise<any[]> => {
  try {
    const url = 'https://api-metrica.yandex.net/management/v1/counter';
    
    // Используем Management API для получения данных
    const response = await fetch(
      `${url}/${config.counterId}/logrequests/evaluate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date1: config.dateFrom,
          date2: config.dateTo,
          metrics: config.metrics,
          dimensions: config.dimensions || [],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Yandex Metrica data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Yandex Metrica data:', error);
    throw error;
  }
};

export default {
  fetchYandexMetricaData,
};

