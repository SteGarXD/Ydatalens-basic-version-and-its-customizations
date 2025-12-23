/**
 * Модуль Combo-чартов
 * Комбинированные визуализации с несколькими типами на одном чарте
 */

import React from 'react';

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'pie';

export interface ComboSeries {
  type: ChartType;
  field: string;
  axis: 'left' | 'right';
  color?: string;
  name: string;
}

export interface ComboChartConfig {
  xAxis: string;
  series: ComboSeries[];
  title?: string;
  legend?: boolean;
}

/**
 * Создать конфигурацию combo-чарта
 */
export const createComboChartConfig = (
  config: ComboChartConfig
): any => {
  return {
    type: 'combo',
    xAxis: config.xAxis,
    series: config.series.map(s => ({
      type: s.type,
      field: s.field,
      yAxis: s.axis,
      color: s.color,
      name: s.name,
    })),
    title: config.title,
    legend: config.legend !== false,
  };
};

/**
 * Валидация combo-чарта
 */
export const validateComboChart = (config: ComboChartConfig): string[] => {
  const errors: string[] = [];

  if (!config.xAxis) {
    errors.push('X-axis field is required');
  }

  if (!config.series || config.series.length === 0) {
    errors.push('At least one series is required');
  }

  const hasLeftAxis = config.series.some(s => s.axis === 'left');
  const hasRightAxis = config.series.some(s => s.axis === 'right');

  if (!hasLeftAxis && !hasRightAxis) {
    errors.push('At least one axis must be used');
  }

  return errors;
};

const ComboChartModule: React.FC = () => {
  return null;
};

export default ComboChartModule;

