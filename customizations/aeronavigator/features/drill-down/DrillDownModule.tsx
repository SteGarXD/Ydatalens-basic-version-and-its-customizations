/**
 * Модуль расширенной поддержки Drill-Down/Drill-Up/Drill-Through
 */

import React from 'react';

export interface DrillConfig {
  field: string;
  level: number;
  parentField?: string;
  childField?: string;
}

export interface DrillThroughConfig {
  sourceChartId: string;
  targetChartId: string;
  fieldMapping: Record<string, string>;
}

/**
 * Выполнить drill-down
 */
export const drillDown = (
  currentData: any[],
  field: string,
  value: any
): any[] => {
  return currentData.filter(item => item[field] === value);
};

/**
 * Выполнить drill-up
 */
export const drillUp = (
  currentData: any[],
  field: string
): any[] => {
  // Агрегировать данные на уровень выше
  const grouped = currentData.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) {
      acc[key] = { ...item };
    }
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
};

/**
 * Переход на связанный отчет (drill-through)
 */
export const drillThrough = async (
  config: DrillThroughConfig,
  selectedValue: any
): Promise<string> => {
  // Создать URL для перехода на связанный чарт с параметрами
  const params = new URLSearchParams();
  Object.entries(config.fieldMapping).forEach(([source, target]) => {
    params.append(target, selectedValue[source]);
  });

  return `/charts/${config.targetChartId}?${params.toString()}`;
};

const DrillDownModule: React.FC = () => {
  return null;
};

export default DrillDownModule;

