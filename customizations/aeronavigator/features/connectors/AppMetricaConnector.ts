/**
 * Коннектор к AppMetrica
 */

export interface AppMetricaConfig {
  applicationId: string;
  apiKey: string;
  dateFrom: string;
  dateTo: string;
  metrics: string[];
  dimensions?: string[];
}

/**
 * Получить данные из AppMetrica
 */
export const fetchAppMetricaData = async (
  config: AppMetricaConfig
): Promise<any[]> => {
  try {
    const url = `https://appmetrica.yandex.ru/api/v1/stat/v2/data`;
    
    const params = new URLSearchParams({
      application_id: config.applicationId,
      date_from: config.dateFrom,
      date_to: config.dateTo,
      metrics: config.metrics.join(','),
      ...(config.dimensions && { dimensions: config.dimensions.join(',') }),
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Authorization': `OAuth ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AppMetrica data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching AppMetrica data:', error);
    throw error;
  }
};

export default {
  fetchAppMetricaData,
};

