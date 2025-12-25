/**
 * Scheduled Reports Module
 * Планировщик отчетов - автоматическая генерация и отправка отчетов
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface ScheduledReport {
  id: string;
  name: string;
  dashboardId?: string;
  queryId?: string;
  format: 'pdf' | 'excel' | 'png' | 'html';
  schedule: string; // Cron expression
  recipients: string[];
  enabled: boolean;
  filters?: Record<string, any>;
}

/**
 * Создание запланированного отчета
 */
export const createScheduledReport = async (report: ScheduledReport): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.SCHEDULED_REPORTS) {
    throw new Error('Scheduled reports are disabled');
  }

  try {
    const response = await fetch('/api/v1/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error('Failed to create scheduled report');
    }

    const result = await response.json();
    console.log(`[ScheduledReports] Report scheduled: ${report.name}`);
    return result.report_id;
  } catch (error) {
    console.error('[ScheduledReports] Error creating report:', error);
    throw error;
  }
};

/**
 * Получение всех запланированных отчетов
 */
export const getScheduledReports = async (): Promise<ScheduledReport[]> => {
  try {
    const response = await fetch('/api/v1/reports/scheduled');
    if (!response.ok) {
      throw new Error('Failed to fetch scheduled reports');
    }
    const result = await response.json();
    return result.reports;
  } catch (error) {
    console.error('[ScheduledReports] Error fetching reports:', error);
    return [];
  }
};

/**
 * Немедленное выполнение отчета
 */
export const executeReportNow = async (reportId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/v1/reports/${reportId}/execute`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to execute report');
    }

    console.log(`[ScheduledReports] Report executed: ${reportId}`);
  } catch (error) {
    console.error('[ScheduledReports] Error executing report:', error);
    throw error;
  }
};

/**
 * Удаление запланированного отчета
 */
export const deleteScheduledReport = async (reportId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/v1/reports/${reportId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete scheduled report');
    }

    console.log(`[ScheduledReports] Report deleted: ${reportId}`);
  } catch (error) {
    console.error('[ScheduledReports] Error deleting report:', error);
    throw error;
  }
};

/**
 * Инициализация планировщика отчетов
 */
export const initializeScheduledReports = async () => {
  if (!AERONAVIGATOR_FEATURES.SCHEDULED_REPORTS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.reports) {
        datalens.reports = {
          create: createScheduledReport,
          getAll: getScheduledReports,
          executeNow: executeReportNow,
          delete: deleteScheduledReport,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Scheduled Reports initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Scheduled Reports:', error);
  }
};

export default initializeScheduledReports;

