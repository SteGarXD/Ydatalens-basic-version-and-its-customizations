/**
 * S2 Pivot Table Widget Component
 * Виджет для использования в DataLens дашбордах
 * Основан на Alibaba AntV S2
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/style.min.css';
import { Spin, Alert, Button, Space, message, Card } from 'antd';
import { DownloadOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { S2DataConfig, S2Options } from '@antv/s2';
import * as XLSX from 'xlsx';

/**
 * Props для S2PivotTableWidget
 * Соответствует интерфейсу виджетов DataLens
 */
export interface S2PivotTableWidgetProps {
  // Данные из DataLens
  data?: any[];
  // Конфигурация виджета
  config?: {
    rows?: string[];
    cols?: string[];
    values?: string[];
    aggregations?: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median'>;
    showTooltip?: boolean;
    showHeader?: boolean;
    frozenRowCount?: number;
    frozenColCount?: number;
    width?: number;
    height?: number;
    showSeriesNumber?: boolean;
    showDefaultHeaderActionIcon?: boolean;
  };
  // Состояние загрузки
  loading?: boolean;
  // Обработчики событий
  onDataChange?: (data: any[]) => void;
  onConfigChange?: (config: any) => void;
  // ID виджета в DataLens
  widgetId?: string;
}

/**
 * Компонент виджета S2 Pivot Table
 */
const S2PivotTableWidget: React.FC<S2PivotTableWidgetProps> = ({
  data = [],
  config = {},
  loading = false,
  onDataChange,
  onConfigChange,
  widgetId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [s2DataConfig, setS2DataConfig] = useState<S2DataConfig | null>(null);
  const [s2Options, setS2Options] = useState<S2Options>({});
  const [dimensions, setDimensions] = useState<{
    rows: string[];
    cols: string[];
    values: string[];
  }>({
    rows: config.rows || [],
    cols: config.cols || [],
    values: config.values || []
  });

  // Получить все доступные поля из данных
  const availableFields = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0] || {});
  }, [data]);

  // Подготовка данных для S2
  useEffect(() => {
    if (!data || data.length === 0) {
      setS2DataConfig(null);
      return;
    }

    try {
      // Если не указаны измерения, используем первые доступные поля
      const rows = dimensions.rows.length > 0 
        ? dimensions.rows 
        : availableFields.slice(0, Math.min(2, availableFields.length));
      const cols = dimensions.cols.length > 0 
        ? dimensions.cols 
        : availableFields.slice(rows.length, rows.length + 1);
      const values = dimensions.values.length > 0 
        ? dimensions.values 
        : availableFields.filter(f => !rows.includes(f) && !cols.includes(f)).slice(0, 1);

      // Создаем структуру данных для S2
      const s2Data: S2DataConfig = {
        fields: {
          rows,
          columns: cols,
          values: values.map(v => ({
            field: v,
            name: v,
            formatter: (value: any) => {
              if (typeof value === 'number') {
                return value.toLocaleString('ru-RU');
              }
              return value;
            }
          }))
        },
        data: data.map((row, index) => ({
          ...row,
          _id: row.id || row._id || `row_${index}`
        })),
        meta: availableFields.map(field => ({
          field,
          name: field,
          formatter: (value: any) => {
            if (typeof value === 'number') {
              return value.toLocaleString('ru-RU');
            }
            return value;
          }
        }))
      };

      setS2DataConfig(s2Data);

      // Настройки S2
      const options: S2Options = {
        width: config.width || (containerRef.current?.clientWidth || 800),
        height: config.height || 600,
        showSeriesNumber: config.showSeriesNumber !== false,
        showDefaultHeaderActionIcon: config.showDefaultHeaderActionIcon !== false,
        tooltip: {
          showTooltip: config.showTooltip !== false,
          operation: {
            hiddenColumns: true,
            sort: true,
            menus: [
              {
                key: 'export',
                text: 'Экспорт',
                icon: 'export'
              }
            ]
          }
        },
        interaction: {
          enableCopy: true,
          selectedCellsSpotlight: true,
          hoverHighlight: true
        },
        style: {
          layoutWidthType: 'adaptive',
          cellCfg: {
            height: 32
          }
        },
        frozenRowCount: config.frozenRowCount || 0,
        frozenColCount: config.frozenColCount || 0
      };

      setS2Options(options);
    } catch (error) {
      console.error('[S2PivotTableWidget] Error preparing data:', error);
      setS2DataConfig(null);
    }
  }, [data, dimensions, availableFields, config]);

  const handleExport = () => {
    if (!s2DataConfig || !data || data.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      const fileName = `pivot_table_s2_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success('Файл успешно экспортирован');
    } catch (error) {
      console.error('[S2PivotTableWidget] Export error:', error);
      message.error('Ошибка экспорта файла');
    }
  };

  const handleReload = () => {
    if (onDataChange) {
      onDataChange([...data]);
    }
    message.info('Данные обновлены');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Загрузка данных..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert
        message="Нет данных"
        description="Загрузите данные для отображения сводной таблицы"
        type="info"
        showIcon
      />
    );
  }

  if (!s2DataConfig) {
    return (
      <Alert
        message="Ошибка подготовки данных"
        description="Не удалось подготовить данные для сводной таблицы"
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Панель инструментов */}
      <div style={{ 
        marginBottom: 12, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space>
          <span style={{ fontWeight: 500 }}>Сводная таблица S2</span>
          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
            {data.length} строк
          </span>
        </Space>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            size="small"
            onClick={handleReload}
          >
            Обновить
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />} 
            size="small"
            onClick={handleExport}
          >
            Экспорт Excel
          </Button>
        </Space>
      </div>

      {/* Контейнер для S2 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1,
          width: '100%', 
          height: config.height || 600,
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          overflow: 'auto'
        }}
      >
        <SheetComponent
          dataCfg={s2DataConfig}
          options={s2Options}
          themeCfg={{
            name: 'default'
          }}
          onRangeSort={(sortParams) => {
            console.debug('[S2PivotTableWidget] Sort:', sortParams);
          }}
          onRangeFilter={(filterParams) => {
            console.debug('[S2PivotTableWidget] Filter:', filterParams);
          }}
        />
      </div>
    </Card>
  );
};

/**
 * Компонент настроек виджета
 * Используется в редакторе виджетов DataLens
 */
export const S2PivotTableSettings: React.FC<{
  config: any;
  onChange: (config: any) => void;
  availableFields: string[];
}> = ({ config, onChange, availableFields }) => {
  return (
    <div>
      <p>Настройки сводной таблицы S2</p>
      <p>Доступные поля: {availableFields.join(', ')}</p>
      {/* Здесь можно добавить UI для настройки rows, cols, values */}
    </div>
  );
};

export default S2PivotTableWidget;

