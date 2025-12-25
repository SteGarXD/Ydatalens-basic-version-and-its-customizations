/**
 * Calendar Integration Module
 * Интеграция с календарями (Google Calendar, Outlook)
 * Автоматическое создание событий на основе данных
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  reminders?: Array<{ minutes: number; method: 'email' | 'popup' }>;
}

export type CalendarProvider = 'google' | 'outlook' | 'ical';

/**
 * Создание события в календаре
 */
export const createCalendarEvent = async (
  event: CalendarEvent,
  provider: CalendarProvider = 'google'
): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.CALENDAR_INTEGRATION) {
    throw new Error('Calendar integration is disabled');
  }

  try {
    const response = await fetch('/api/v1/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        provider,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const result = await response.json();
    console.log(`[Calendar] Event created: ${event.title}`);
    return result.event_id;
  } catch (error) {
    console.error('[Calendar] Error creating event:', error);
    throw error;
  }
};

/**
 * Создание события из алерта
 */
export const createEventFromAlert = async (
  alert: { title: string; message: string; severity: string; timestamp: Date },
  provider: CalendarProvider = 'google'
): Promise<string> => {
  const event: CalendarEvent = {
    title: `Алерт: ${alert.title}`,
    description: alert.message,
    start: alert.timestamp,
    end: new Date(alert.timestamp.getTime() + 30 * 60 * 1000), // 30 минут
    reminders: [
      { minutes: 0, method: 'popup' },
    ],
  };

  return createCalendarEvent(event, provider);
};

/**
 * Создание события из рекомендации
 */
export const createEventFromRecommendation = async (
  recommendation: { title: string; action: string; priority: string },
  provider: CalendarProvider = 'google'
): Promise<string> => {
  const event: CalendarEvent = {
    title: `Рекомендация: ${recommendation.title}`,
    description: recommendation.action,
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000), // 1 час
    reminders: recommendation.priority === 'critical' || recommendation.priority === 'high'
      ? [{ minutes: 15, method: 'popup' }]
      : [],
  };

  return createCalendarEvent(event, provider);
};

/**
 * Экспорт событий в iCal формат
 */
export const exportToICal = (events: CalendarEvent[]): string => {
  let ical = 'BEGIN:VCALENDAR\n';
  ical += 'VERSION:2.0\n';
  ical += 'PRODID:-//AeronavigatorBI//EN\n';
  ical += 'CALSCALE:GREGORIAN\n';

  events.forEach(event => {
    ical += 'BEGIN:VEVENT\n';
    ical += `UID:${event.id || `event-${Date.now()}-${Math.random()}`}\n`;
    ical += `DTSTART:${formatICalDate(event.start)}\n`;
    ical += `DTEND:${formatICalDate(event.end)}\n`;
    ical += `SUMMARY:${event.title}\n`;
    if (event.description) {
      ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
    }
    if (event.location) {
      ical += `LOCATION:${event.location}\n`;
    }
    ical += 'END:VEVENT\n';
  });

  ical += 'END:VCALENDAR\n';
  return ical;
};

/**
 * Форматирование даты для iCal
 */
const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Скачивание iCal файла
 */
export const downloadICal = (events: CalendarEvent[], filename: string = 'events.ics'): void => {
  const ical = exportToICal(events);
  const blob = new Blob([ical], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Инициализация Calendar Integration
 */
export const initializeCalendarIntegration = async () => {
  if (!AERONAVIGATOR_FEATURES.CALENDAR_INTEGRATION) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.calendar) {
        datalens.calendar = {
          createEvent: createCalendarEvent,
          createFromAlert: createEventFromAlert,
          createFromRecommendation: createEventFromRecommendation,
          exportToICal,
          downloadICal,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Calendar Integration initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Calendar Integration:', error);
  }
};

export default initializeCalendarIntegration;

