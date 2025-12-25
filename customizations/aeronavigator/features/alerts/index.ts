/**
 * Automated Alerts and Notifications Module
 * Автоматические алерты и уведомления
 * Email, Telegram, Webhook, In-app уведомления
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'anomaly';
    value: any;
  };
  channels: ('email' | 'telegram' | 'webhook' | 'inapp')[];
  recipients?: string[];
  webhookUrl?: string;
  enabled: boolean;
  cooldown?: number; // секунды между повторными алертами
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data?: any;
  timestamp: Date;
  acknowledged?: boolean;
}

let alertRules: Map<string, AlertRule> = new Map();
let activeAlerts: Map<string, Alert> = new Map();
let lastAlertTime: Map<string, number> = new Map();

/**
 * Создание правила алерта
 */
export const createAlertRule = async (rule: AlertRule): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.AUTOMATED_ALERTS) {
    throw new Error('Automated alerts are disabled');
  }

  alertRules.set(rule.id, rule);
  
  // Сохранение на backend
  try {
    await fetch('/api/v1/alerts/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
  } catch (error) {
    console.warn('[Alerts] Failed to save rule to backend:', error);
  }

  console.log(`[Alerts] Rule created: ${rule.name}`);
  return rule.id;
};

/**
 * Проверка данных на соответствие правилам алертов
 */
export const checkAlerts = async (data: any[]): Promise<Alert[]> => {
  if (!AERONAVIGATOR_FEATURES.AUTOMATED_ALERTS) {
    return [];
  }

  const triggeredAlerts: Alert[] = [];

  for (const [ruleId, rule] of alertRules.entries()) {
    if (!rule.enabled) continue;

    // Проверка cooldown
    const lastTime = lastAlertTime.get(ruleId) || 0;
    const cooldown = rule.cooldown || 0;
    if (Date.now() - lastTime < cooldown * 1000) {
      continue;
    }

    // Проверка условия
    const triggered = await checkCondition(data, rule.condition);
    
    if (triggered) {
      const alert: Alert = {
        id: `${ruleId}-${Date.now()}`,
        ruleId,
        severity: determineSeverity(rule.condition),
        message: generateAlertMessage(rule),
        data: extractRelevantData(data, rule.condition),
        timestamp: new Date(),
      };

      triggeredAlerts.push(alert);
      activeAlerts.set(alert.id, alert);
      lastAlertTime.set(ruleId, Date.now());

      // Отправка уведомлений
      await sendNotifications(rule, alert);
    }
  }

  return triggeredAlerts;
};

/**
 * Проверка условия
 */
const checkCondition = async (
  data: any[],
  condition: AlertRule['condition']
): Promise<boolean> => {
  if (condition.operator === 'anomaly') {
    // Использование ML для обнаружения аномалий
    try {
      const { detectAnomalies } = await import('../ai-ml/AnomalyDetection');
      const result = await detectAnomalies(data, {
        fields: [condition.field],
        method: 'auto',
      });
      return result.anomalies.length > 0;
    } catch (error) {
      console.warn('[Alerts] Anomaly detection failed:', error);
      return false;
    }
  }

  // Стандартные операторы
  for (const row of data) {
    const fieldValue = row[condition.field];
    if (fieldValue === undefined || fieldValue === null) continue;

    let matches = false;
    switch (condition.operator) {
      case 'gt':
        matches = fieldValue > condition.value;
        break;
      case 'lt':
        matches = fieldValue < condition.value;
        break;
      case 'eq':
        matches = fieldValue === condition.value;
        break;
      case 'gte':
        matches = fieldValue >= condition.value;
        break;
      case 'lte':
        matches = fieldValue <= condition.value;
        break;
      case 'contains':
        matches = String(fieldValue).includes(String(condition.value));
        break;
    }

    if (matches) {
      return true;
    }
  }

  return false;
};

/**
 * Определение серьезности алерта
 */
const determineSeverity = (condition: AlertRule['condition']): Alert['severity'] => {
  if (condition.operator === 'anomaly') {
    return 'warning';
  }
  if (condition.operator === 'gt' || condition.operator === 'lt') {
    return 'error';
  }
  return 'info';
};

/**
 * Генерация сообщения алерта
 */
const generateAlertMessage = (rule: AlertRule): string => {
  const { field, operator, value } = rule.condition;
  const operatorText: Record<string, string> = {
    gt: 'превысило',
    lt: 'упало ниже',
    eq: 'равно',
    gte: 'превысило или равно',
    lte: 'упало ниже или равно',
    contains: 'содержит',
    anomaly: 'обнаружена аномалия в',
  };

  return `Алерт "${rule.name}": ${field} ${operatorText[operator] || operator} ${value}`;
};

/**
 * Извлечение релевантных данных
 */
const extractRelevantData = (data: any[], condition: AlertRule['condition']): any => {
  if (data.length === 0) return null;
  
  const relevantRows = data.filter(row => {
    const fieldValue = row[condition.field];
    if (fieldValue === undefined || fieldValue === null) return false;
    
    switch (condition.operator) {
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'eq':
        return fieldValue === condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      default:
        return true;
    }
  });

  return relevantRows.slice(0, 10); // Первые 10 строк
};

/**
 * Отправка уведомлений
 */
const sendNotifications = async (rule: AlertRule, alert: Alert): Promise<void> => {
  const promises: Promise<void>[] = [];

  for (const channel of rule.channels) {
    switch (channel) {
      case 'email':
        promises.push(sendEmailNotification(rule, alert));
        break;
      case 'telegram':
        promises.push(sendTelegramNotification(rule, alert));
        break;
      case 'webhook':
        if (rule.webhookUrl) {
          promises.push(sendWebhookNotification(rule, alert));
        }
        break;
      case 'inapp':
        promises.push(sendInAppNotification(alert));
        break;
    }
  }

  await Promise.allSettled(promises);
};

/**
 * Отправка Email уведомления
 */
const sendEmailNotification = async (rule: AlertRule, alert: Alert): Promise<void> => {
  try {
    await fetch('/api/v1/alerts/notify/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: rule.recipients || [],
        subject: `Алерт: ${rule.name}`,
        message: alert.message,
        severity: alert.severity,
        data: alert.data,
      }),
    });
  } catch (error) {
    console.error('[Alerts] Email notification failed:', error);
  }
};

/**
 * Отправка Telegram уведомления
 */
const sendTelegramNotification = async (rule: AlertRule, alert: Alert): Promise<void> => {
  try {
    await fetch('/api/v1/alerts/notify/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatIds: rule.recipients || [],
        message: `🚨 *${rule.name}*\n\n${alert.message}`,
        severity: alert.severity,
      }),
    });
  } catch (error) {
    console.error('[Alerts] Telegram notification failed:', error);
  }
};

/**
 * Отправка Webhook уведомления
 */
const sendWebhookNotification = async (rule: AlertRule, alert: Alert): Promise<void> => {
  try {
    await fetch(rule.webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rule: rule.name,
        alert: {
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          data: alert.data,
        },
      }),
    });
  } catch (error) {
    console.error('[Alerts] Webhook notification failed:', error);
  }
};

/**
 * Отправка In-app уведомления
 */
const sendInAppNotification = async (alert: Alert): Promise<void> => {
  try {
    // Регистрация в системе уведомлений DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (datalens.notifications) {
        datalens.notifications.show({
          type: alert.severity,
          title: 'Алерт',
          message: alert.message,
          data: alert,
        });
      } else {
        // Fallback: использование браузерных уведомлений
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Алерт', {
            body: alert.message,
            icon: '/OP-compass.png',
          });
        }
      }
    }
  } catch (error) {
    console.error('[Alerts] In-app notification failed:', error);
  }
};

/**
 * Получение активных алертов
 */
export const getActiveAlerts = (): Alert[] => {
  return Array.from(activeAlerts.values());
};

/**
 * Подтверждение алерта
 */
export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.acknowledged = true;
    activeAlerts.set(alertId, alert);
    
    try {
      await fetch(`/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('[Alerts] Failed to acknowledge on backend:', error);
    }
  }
};

/**
 * Инициализация системы алертов
 */
export const initializeAlerts = async () => {
  if (!AERONAVIGATOR_FEATURES.AUTOMATED_ALERTS) {
    return;
  }

  try {
    // Запрос разрешения на браузерные уведомления
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    // Загрузка правил с backend
    try {
      const response = await fetch('/api/v1/alerts/rules');
      if (response.ok) {
        const rules: AlertRule[] = await response.json();
        rules.forEach(rule => alertRules.set(rule.id, rule));
      }
    } catch (error) {
      console.warn('[Alerts] Failed to load rules from backend:', error);
    }

    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.alerts) {
        datalens.alerts = {
          createRule: createAlertRule,
          checkAlerts,
          getActiveAlerts,
          acknowledgeAlert,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Automated Alerts initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Alerts:', error);
  }
};

export default initializeAlerts;

