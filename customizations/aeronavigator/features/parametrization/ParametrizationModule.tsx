/**
 * Модуль параметризации чартов
 * Параметры на уровне чарта с переопределением с дашборда
 */

import React from 'react';

export interface ChartParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  defaultValue: any;
  options?: any[]; // Для типа 'select'
  required?: boolean;
}

export interface ChartParametrization {
  chartId: string;
  parameters: ChartParameter[];
  overrides?: Record<string, any>; // Переопределения с дашборда
}

/**
 * Применить параметры к чарту
 */
export const applyParameters = (
  chartConfig: any,
  parameters: Record<string, any>
): any => {
  const updated = { ...chartConfig };

  Object.entries(parameters).forEach(([key, value]) => {
    // Рекурсивно обновить конфигурацию
    updateNestedProperty(updated, key, value);
  });

  return updated;
};

const updateNestedProperty = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
};

/**
 * Получить параметры чарта
 */
export const getChartParameters = async (chartId: string): Promise<ChartParameter[]> => {
  try {
    const response = await fetch(`/api/v1/charts/${chartId}/parameters`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.parameters || [];
  } catch (error) {
    console.error('Error getting chart parameters:', error);
    return [];
  }
};

const ParametrizationModule: React.FC = () => {
  return null;
};

export default ParametrizationModule;

