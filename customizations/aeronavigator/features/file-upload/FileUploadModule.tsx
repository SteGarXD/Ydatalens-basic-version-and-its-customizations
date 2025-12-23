/**
 * Модуль загрузки файлов (CSV/Excel/JSON/XML/Parquet и другие форматы)
 * Загрузка файлов любого формата как источника данных
 */

import React, { useState } from 'react';

export type FileFormat = 
  | 'csv' 
  | 'xlsx' 
  | 'xls' 
  | 'json' 
  | 'xml' 
  | 'parquet' 
  | 'tsv' 
  | 'txt'
  | 'ods'
  | 'pdf'
  | 'html'
  | 'avro'
  | 'orc';

export interface FileUploadOptions {
  file: File;
  datasetName: string;
  format?: FileFormat; // Автоопределение, если не указан
  parseOptions?: {
    delimiter?: string; // Для CSV/TSV
    skipRows?: number;
    encoding?: string;
    sheetName?: string; // Для Excel
    headerRow?: number; // Номер строки с заголовками
    dateFormat?: string;
    decimalSeparator?: '.' | ',';
    thousandsSeparator?: string;
    quoteChar?: string;
    escapeChar?: string;
  };
  autoDetectTypes?: boolean; // Автоматическое определение типов данных
  previewRows?: number; // Количество строк для предпросмотра
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'parsing' | 'validating' | 'importing' | 'complete';
}

export interface FilePreview {
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    sampleValues: any[];
  }>;
  rowCount: number;
  previewData: any[];
  errors?: string[];
}

/**
 * Определить формат файла по расширению или содержимому
 */
export const detectFileFormat = (file: File): FileFormat => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  const formatMap: Record<string, FileFormat> = {
    'csv': 'csv',
    'tsv': 'tsv',
    'txt': 'txt',
    'xlsx': 'xlsx',
    'xls': 'xls',
    'ods': 'ods',
    'json': 'json',
    'xml': 'xml',
    'parquet': 'parquet',
    'avro': 'avro',
    'orc': 'orc',
    'pdf': 'pdf',
    'html': 'html',
  };

  return formatMap[extension || ''] || 'csv';
};

/**
 * Предпросмотр файла перед загрузкой
 */
export const previewFile = async (
  file: File,
  options: Partial<FileUploadOptions> = {}
): Promise<FilePreview> => {
  const format = options.format || detectFileFormat(file);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    formData.append('preview', 'true');
    if (options.parseOptions) {
      formData.append('parseOptions', JSON.stringify(options.parseOptions));
    }

    const response = await fetch('/api/v1/datasets/upload/preview', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to preview file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error previewing file:', error);
    throw error;
  }
};

/**
 * Загрузить файл и создать датасет
 */
export const uploadFile = async (
  options: FileUploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ datasetId: string; rowCount: number; columns: any[] }> => {
  const format = options.format || detectFileFormat(options.file);
  
  const formData = new FormData();
  formData.append('file', options.file);
  formData.append('datasetName', options.datasetName);
  formData.append('format', format);
  formData.append('autoDetectTypes', String(options.autoDetectTypes !== false));
  
  if (options.parseOptions) {
    formData.append('parseOptions', JSON.stringify(options.parseOptions));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: (e.loaded / e.total) * 100,
          stage: 'uploading',
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (onProgress) {
          onProgress({
            loaded: response.rowCount || 0,
            total: response.rowCount || 0,
            percentage: 100,
            stage: 'complete',
          });
        }
        resolve(response);
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.message || `Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', '/api/v1/datasets/upload');
    xhr.send(formData);
  });
};

/**
 * Получить список поддерживаемых форматов
 */
export const getSupportedFormats = (): Array<{
  format: FileFormat;
  name: string;
  extensions: string[];
  description: string;
  maxSize?: number; // MB
}> => {
  return [
    {
      format: 'csv',
      name: 'CSV',
      extensions: ['csv', 'txt'],
      description: 'Comma-separated values',
      maxSize: 500,
    },
    {
      format: 'tsv',
      name: 'TSV',
      extensions: ['tsv'],
      description: 'Tab-separated values',
      maxSize: 500,
    },
    {
      format: 'xlsx',
      name: 'Excel (XLSX)',
      extensions: ['xlsx'],
      description: 'Microsoft Excel 2007+',
      maxSize: 100,
    },
    {
      format: 'xls',
      name: 'Excel (XLS)',
      extensions: ['xls'],
      description: 'Microsoft Excel 97-2003',
      maxSize: 50,
    },
    {
      format: 'ods',
      name: 'OpenDocument Spreadsheet',
      extensions: ['ods'],
      description: 'LibreOffice/OpenOffice spreadsheet',
      maxSize: 100,
    },
    {
      format: 'json',
      name: 'JSON',
      extensions: ['json'],
      description: 'JavaScript Object Notation',
      maxSize: 200,
    },
    {
      format: 'xml',
      name: 'XML',
      extensions: ['xml'],
      description: 'Extensible Markup Language',
      maxSize: 200,
    },
    {
      format: 'parquet',
      name: 'Parquet',
      extensions: ['parquet'],
      description: 'Apache Parquet columnar format',
      maxSize: 1000,
    },
    {
      format: 'avro',
      name: 'Avro',
      extensions: ['avro'],
      description: 'Apache Avro binary format',
      maxSize: 1000,
    },
    {
      format: 'orc',
      name: 'ORC',
      extensions: ['orc'],
      description: 'Optimized Row Columnar format',
      maxSize: 1000,
    },
    {
      format: 'pdf',
      name: 'PDF',
      extensions: ['pdf'],
      description: 'Portable Document Format (таблицы)',
      maxSize: 50,
    },
    {
      format: 'html',
      name: 'HTML',
      extensions: ['html', 'htm'],
      description: 'HTML tables',
      maxSize: 50,
    },
  ];
};

/**
 * Валидация файла перед загрузкой
 */
export const validateFile = (
  file: File,
  format?: FileFormat
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const detectedFormat = format || detectFileFormat(file);
  const supportedFormats = getSupportedFormats();
  const formatInfo = supportedFormats.find(f => f.format === detectedFormat);

  if (!formatInfo) {
    errors.push(`Формат файла ${detectedFormat} не поддерживается`);
    return { valid: false, errors };
  }

  // Проверка размера
  const maxSizeMB = formatInfo.maxSize || 100;
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    errors.push(
      `Размер файла (${fileSizeMB.toFixed(2)} MB) превышает максимальный (${maxSizeMB} MB)`
    );
  }

  // Проверка типа файла
  if (!formatInfo.extensions.some(ext => file.name.toLowerCase().endsWith(`.${ext}`))) {
    errors.push(`Расширение файла не соответствует формату ${formatInfo.name}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Компонент загрузки файла с поддержкой всех форматов
 */
export const FileUploadComponent: React.FC<{
  onUploadComplete?: (datasetId: string, rowCount: number) => void;
  onError?: (error: Error) => void;
  onPreview?: (preview: FilePreview) => void;
  allowedFormats?: FileFormat[];
  maxSize?: number; // MB
}> = ({ 
  onUploadComplete, 
  onError, 
  onPreview,
  allowedFormats,
  maxSize,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | undefined>();

  const supportedFormats = getSupportedFormats();
  const formats = allowedFormats 
    ? supportedFormats.filter(f => allowedFormats.includes(f.format))
    : supportedFormats;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация
    const validation = validateFile(file, selectedFormat);
    if (!validation.valid) {
      onError?.(new Error(validation.errors.join(', ')));
      return;
    }

    // Предпросмотр
    try {
      const previewData = await previewFile(file, { format: selectedFormat });
      setPreview(previewData);
      onPreview?.(previewData);
    } catch (error) {
      console.warn('Preview failed:', error);
    }

    // Загрузка
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0, stage: 'uploading' });

    try {
      const result = await uploadFile(
        {
          file,
          datasetName: file.name.replace(/\.[^/.]+$/, ''),
          format: selectedFormat,
          autoDetectTypes: true,
        },
        setProgress
      );

      onUploadComplete?.(result.datasetId, result.rowCount);
    } catch (error: any) {
      onError?.(error);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <label>
          Выберите формат файла (опционально, будет определен автоматически):
          <select
            value={selectedFormat || ''}
            onChange={(e) => setSelectedFormat(e.target.value as FileFormat || undefined)}
            style={{ marginLeft: '8px', padding: '4px 8px' }}
          >
            <option value="">Автоопределение</option>
            {formats.map(f => (
              <option key={f.format} value={f.format}>
                {f.name} ({f.extensions.join(', ')})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          accept={formats.flatMap(f => f.extensions.map(ext => `.${ext}`)).join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ padding: '8px' }}
        />
      </div>

      {uploading && progress && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Загрузка: {progress.stage}</strong>
          </div>
          <progress value={progress.percentage} max={100} style={{ width: '100%' }} />
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            {Math.round(progress.percentage)}% ({Math.round(progress.loaded / 1024)} KB / {Math.round(progress.total / 1024)} KB)
          </div>
        </div>
      )}

      {preview && !uploading && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h4>Предпросмотр:</h4>
          <p>Строк: {preview.rowCount}</p>
          <p>Колонок: {preview.columns.length}</p>
          <table style={{ width: '100%', marginTop: '8px', fontSize: '12px' }}>
            <thead>
              <tr>
                {preview.columns.map(col => (
                  <th key={col.name} style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    {col.name} ({col.type})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.previewData.slice(0, 5).map((row, idx) => (
                <tr key={idx}>
                  {preview.columns.map(col => (
                    <td key={col.name} style={{ padding: '4px', borderBottom: '1px solid #eee' }}>
                      {String(row[col.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <strong>Поддерживаемые форматы:</strong>
        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
          {formats.map(f => (
            <li key={f.format}>
              {f.name} ({f.extensions.join(', ')}) - до {f.maxSize} MB
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FileUploadModule: React.FC = () => {
  return null;
};

export default FileUploadModule;
