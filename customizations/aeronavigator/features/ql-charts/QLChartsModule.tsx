/**
 * Модуль QL-чартов и вычисляемых полей
 * Расширенный конструктор вычисляемых полей
 */

import React from 'react';

export interface CalculatedField {
  name: string;
  formula: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  description?: string;
}

export interface QLChartConfig {
  query: string;
  calculatedFields?: CalculatedField[];
  parameters?: Record<string, any>;
}

/**
 * Валидация формулы вычисляемого поля
 */
export const validateFormula = (formula: string): { valid: boolean; error?: string } => {
  try {
    // Базовая валидация синтаксиса
    // В реальной реализации нужно использовать парсер формул
    const allowedFunctions = [
      'SUM', 'AVG', 'COUNT', 'MAX', 'MIN',
      'IF', 'CASE', 'ROUND', 'ABS', 'SQRT',
      'CONCAT', 'SUBSTRING', 'UPPER', 'LOWER',
      'DATE', 'YEAR', 'MONTH', 'DAY',
    ];

    // Проверка на наличие только разрешенных функций и полей
    const functionPattern = new RegExp(`\\b(${allowedFunctions.join('|')})\\s*\\(`, 'i');
    
    if (!functionPattern.test(formula) && !formula.match(/^\[[\w\s]+\]$/)) {
      return { valid: false, error: 'Formula must contain valid functions or field references' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};

/**
 * Вычислить значение поля
 */
export const evaluateCalculatedField = (
  field: CalculatedField,
  row: Record<string, any>
): any => {
  try {
    // Заменить ссылки на поля значениями из строки
    let formula = field.formula;
    Object.keys(row).forEach(key => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      formula = formula.replace(regex, JSON.stringify(row[key]));
    });

    // В реальной реализации нужно использовать безопасный парсер выражений
    // Для демонстрации используем eval (НЕ использовать в production!)
    // eslint-disable-next-line no-eval
    return eval(formula);
  } catch (error) {
    console.error('Error evaluating calculated field:', error);
    return null;
  }
};

/**
 * Получить список доступных функций для формул
 */
export const getAvailableFunctions = (): Array<{ name: string; description: string; syntax: string }> => {
  return [
    { name: 'SUM', description: 'Сумма значений', syntax: 'SUM([field])' },
    { name: 'AVG', description: 'Среднее значение', syntax: 'AVG([field])' },
    { name: 'COUNT', description: 'Количество', syntax: 'COUNT([field])' },
    { name: 'IF', description: 'Условное выражение', syntax: 'IF(condition, value_if_true, value_if_false)' },
    { name: 'ROUND', description: 'Округление', syntax: 'ROUND([field], decimals)' },
  ];
};

const QLChartsModule: React.FC = () => {
  return null;
};

export default QLChartsModule;

