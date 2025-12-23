/**
 * Коннектор к Google Sheets
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey?: string;
  accessToken?: string;
}

/**
 * Получить данные из Google Sheets
 */
export const fetchGoogleSheetsData = async (
  config: GoogleSheetsConfig
): Promise<any[]> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}`;
    const headers: Record<string, string> = {};

    if (config.accessToken) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    } else if (config.apiKey) {
      headers['X-Goog-Api-Key'] = config.apiKey;
    }

    const response = await fetch(`${url}?key=${config.apiKey || ''}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets data: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Преобразовать в массив объектов
    if (data.values && data.values.length > 0) {
      const headers = data.values[0];
      return data.values.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }

    return [];
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
};

export default {
  fetchGoogleSheetsData,
};

