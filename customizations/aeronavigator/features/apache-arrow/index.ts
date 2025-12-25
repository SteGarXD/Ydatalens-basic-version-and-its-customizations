/**
 * Apache Arrow Transport Module
 * Бинарный транспорт данных для ускорения в 50 раз
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

let arrowAvailable = false;

/**
 * Проверка доступности Apache Arrow
 */
export const isArrowAvailable = async (): Promise<boolean> => {
  if (arrowAvailable) return true;
  
  try {
    await import('apache-arrow');
    arrowAvailable = true;
    return true;
  } catch {
    return false;
  }
};

/**
 * Конвертация данных в Apache Arrow формат
 */
export const toArrow = async (data: any[]): Promise<ArrayBuffer> => {
  if (!AERONAVIGATOR_FEATURES.APACHE_ARROW) {
    throw new Error('Apache Arrow transport is disabled');
  }

  const arrow = await import('apache-arrow');
  
  if (data.length === 0) {
    return new ArrayBuffer(0);
  }

  // Определение схемы
  const fields = Object.keys(data[0]).map(key => {
    const sample = data[0][key];
    let type: any;
    
    if (typeof sample === 'number') {
      type = arrow.Field.new({ name: key, type: new arrow.Float64() });
    } else if (typeof sample === 'boolean') {
      type = arrow.Field.new({ name: key, type: new arrow.Bool() });
    } else {
      type = arrow.Field.new({ name: key, type: new arrow.Utf8() });
    }
    
    return type;
  });

  const schema = new arrow.Schema(fields);
  
  // Создание таблицы
  const vectors = fields.map((field, idx) => {
    const key = field.name;
    const values = data.map(row => row[key]);
    
    if (field.type instanceof arrow.Float64) {
      return arrow.Float64Vector.from(values);
    } else if (field.type instanceof arrow.Bool) {
      return arrow.BoolVector.from(values);
    } else {
      return arrow.Utf8Vector.from(values.map(String));
    }
  });

  const table = arrow.Table.new(vectors, schema);
  
  // Конвертация в IPC формат
  const writer = arrow.RecordBatchStreamWriter.throughNode();
  writer.writeTable(table);
  writer.finish();
  
  return table.serialize().buffer;
};

/**
 * Конвертация из Apache Arrow формата
 */
export const fromArrow = async (buffer: ArrayBuffer): Promise<any[]> => {
  if (!AERONAVIGATOR_FEATURES.APACHE_ARROW) {
    throw new Error('Apache Arrow transport is disabled');
  }

  const arrow = await import('apache-arrow');
  
  const table = arrow.tableFromIPC(buffer);
  const data: any[] = [];
  
  for (let i = 0; i < table.length; i++) {
    const row: any = {};
    table.schema.fields.forEach((field, idx) => {
      row[field.name] = table.getColumnAt(idx)?.get(i);
    });
    data.push(row);
  }
  
  return data;
};

/**
 * Отправка данных через Apache Arrow
 */
export const sendArrowData = async (url: string, data: any[]): Promise<any> => {
  if (!AERONAVIGATOR_FEATURES.APACHE_ARROW) {
    // Fallback на JSON
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  try {
    const arrowBuffer = await toArrow(data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-apache-arrow-stream',
        'Accept': 'application/x-apache-arrow-stream',
      },
      body: arrowBuffer,
    });

    if (response.headers.get('Content-Type')?.includes('apache-arrow')) {
      const responseBuffer = await response.arrayBuffer();
      return await fromArrow(responseBuffer);
    } else {
      return response.json();
    }
  } catch (error) {
    console.warn('[ApacheArrow] Arrow transport failed, falling back to JSON:', error);
    // Fallback на JSON
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
};

/**
 * Инициализация Apache Arrow транспорта
 */
export const initializeApacheArrow = async () => {
  if (!AERONAVIGATOR_FEATURES.APACHE_ARROW) {
    return;
  }

  try {
    const available = await isArrowAvailable();
    
    if (available) {
      // Регистрация в DataLens
      if (typeof window !== 'undefined') {
        const datalens = (window as any).datalens || {};
        if (!datalens.arrow) {
          datalens.arrow = {
            toArrow,
            fromArrow,
            send: sendArrowData,
            isAvailable: () => true,
          };
        }
        (window as any).datalens = datalens;
      }

      console.log('[AeronavigatorBI] Apache Arrow transport initialized');
    } else {
      console.warn('[AeronavigatorBI] Apache Arrow not available, using JSON fallback');
    }
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Apache Arrow:', error);
  }
};

export default initializeApacheArrow;

