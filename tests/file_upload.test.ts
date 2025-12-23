/**
 * Тесты для модуля загрузки файлов
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  detectFileFormat,
  validateFile,
  getSupportedFormats,
  previewFile,
  uploadFile,
} from '../customizations/aeronavigator/features/file-upload/FileUploadModule';

describe('FileUploadModule', () => {
  describe('detectFileFormat', () => {
    it('должен определить CSV по расширению', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      expect(detectFileFormat(file)).toBe('csv');
    });

    it('должен определить Excel по расширению', () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      expect(detectFileFormat(file)).toBe('xlsx');
    });

    it('должен определить JSON по расширению', () => {
      const file = new File([''], 'test.json', { type: 'application/json' });
      expect(detectFileFormat(file)).toBe('json');
    });
  });

  describe('validateFile', () => {
    it('должен валидировать корректный CSV файл', () => {
      const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('должен отклонять файл слишком большого размера', () => {
      // Создать большой файл (симуляция)
      const largeContent = 'x'.repeat(600 * 1024 * 1024); // 600 MB
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getSupportedFormats', () => {
    it('должен вернуть список поддерживаемых форматов', () => {
      const formats = getSupportedFormats();
      expect(formats.length).toBeGreaterThan(0);
      expect(formats.some(f => f.format === 'csv')).toBe(true);
      expect(formats.some(f => f.format === 'xlsx')).toBe(true);
      expect(formats.some(f => f.format === 'json')).toBe(true);
    });
  });
});

