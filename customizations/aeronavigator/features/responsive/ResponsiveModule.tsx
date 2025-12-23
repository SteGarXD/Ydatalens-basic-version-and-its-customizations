/**
 * Модуль адаптивной верстки
 * Оптимизация для мобильных устройств
 */

import React, { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

/**
 * Хук для определения текущего breakpoint
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
};

/**
 * Хук для проверки, является ли устройство мобильным
 */
export const useIsMobile = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
};

/**
 * Адаптивные стили для дашбордов
 */
export const getResponsiveStyles = (breakpoint: Breakpoint) => {
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  
  return {
    dashboard: {
      padding: isMobile ? '8px' : '16px',
      gridColumns: isMobile ? 1 : 12,
    },
    widget: {
      minHeight: isMobile ? '200px' : '300px',
      marginBottom: isMobile ? '8px' : '16px',
    },
  };
};

const ResponsiveModule: React.FC = () => {
  return null;
};

export default ResponsiveModule;

