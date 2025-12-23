/**
 * Модуль мультиязычности
 * Поддержка русского и английского языков
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'ru' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  ru: {
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      create: 'Создать',
      search: 'Поиск',
    },
    dashboard: {
      title: 'Дашборд',
      create: 'Создать дашборд',
      edit: 'Редактировать дашборд',
    },
    chart: {
      title: 'График',
      create: 'Создать график',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
    },
    dashboard: {
      title: 'Dashboard',
      create: 'Create dashboard',
      edit: 'Edit dashboard',
    },
    chart: {
      title: 'Chart',
      create: 'Create chart',
    },
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Провайдер i18n
 */
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Вернуть ключ, если перевод не найден
      }
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Хук для использования переводов
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

const I18nModule: React.FC = () => {
  return null;
};

export default I18nModule;

