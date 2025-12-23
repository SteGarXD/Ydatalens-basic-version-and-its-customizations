export { 
  default as FileUploadModule, 
  uploadFile, 
  FileUploadComponent,
  previewFile,
  detectFileFormat,
  validateFile,
  getSupportedFormats,
} from './FileUploadModule';
export type { 
  FileUploadOptions, 
  UploadProgress,
  FileFormat,
  FilePreview,
} from './FileUploadModule';
