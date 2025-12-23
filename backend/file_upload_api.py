"""
API endpoints для загрузки файлов
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json
from .file_upload_service import FileUploadService

router = APIRouter(prefix="/api/v1/datasets", tags=["file-upload"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    datasetName: str = Form(...),
    format: Optional[str] = Form(None),
    parseOptions: Optional[str] = Form(None),
    autoDetectTypes: bool = Form(True),
):
    """
    Загрузить файл и создать датасет
    
    Поддерживаемые форматы:
    - CSV, TSV, TXT
    - Excel (XLSX, XLS, ODS)
    - JSON, XML
    - Parquet, Avro, ORC
    - PDF (таблицы), HTML (таблицы)
    """
    try:
        # Парсинг опций
        parse_options = {}
        if parseOptions:
            parse_options = json.loads(parseOptions)
        
        # Инициализация сервиса с интеграцией DataLens
        try:
            from .file_upload_service import FileUploadService
            from .integration import get_clickhouse_client
            
            # Получить ClickHouse клиент через механизмы DataLens
            clickhouse_client = get_clickhouse_client()
            
            if not clickhouse_client:
                # Если клиент не доступен, возвращаем ошибку
                raise HTTPException(
                    status_code=503,
                    detail="ClickHouse client not available. Please configure DataLens connection."
                )
            
            # Инициализировать сервис
            service = FileUploadService(clickhouse_client)
            
            # Обработать загрузку
            result = await service.process_upload(
                file, datasetName, format, parse_options, autoDetectTypes
            )
            
            return result
        except HTTPException:
            raise
        except ImportError as e:
            logger.error(f"Import error: {e}")
            raise HTTPException(status_code=500, detail="FileUploadService not available")
        except Exception as e:
            logger.error(f"Error processing upload: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/preview")
async def preview_file(
    file: UploadFile = File(...),
    format: Optional[str] = Form(None),
    parseOptions: Optional[str] = Form(None),
    previewRows: int = Form(10),
):
    """Предпросмотр файла перед загрузкой"""
    try:
        parse_options = {}
        if parseOptions:
            parse_options = json.loads(parseOptions)
        
        # Инициализация сервиса для предпросмотра
        try:
            from .file_upload_service import FileUploadService
            from .integration import get_clickhouse_client
            
            # Получить ClickHouse клиент (для предпросмотра может быть не обязателен)
            clickhouse_client = get_clickhouse_client()
            
            # Инициализировать сервис (клиент может быть None для предпросмотра)
            service = FileUploadService(clickhouse_client) if clickhouse_client else None
            
            if service:
                result = await service.preview_file(file, format, parse_options, previewRows)
                return result
            else:
                # Предпросмотр без ClickHouse (только чтение файла)
                from .file_upload_service import FileUploadService
                # Создать временный сервис только для чтения
                import tempfile
                temp_service = FileUploadService(None, temp_dir=tempfile.gettempdir())
                result = await temp_service.preview_file(file, format, parse_options, previewRows)
                return result
        except ImportError as e:
            logger.error(f"Import error: {e}")
            raise HTTPException(status_code=500, detail="FileUploadService not available")
        except Exception as e:
            logger.error(f"Error previewing file: {e}")
            raise HTTPException(status_code=500, detail=f"Error previewing file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/formats")
async def get_supported_formats():
    """Получить список поддерживаемых форматов"""
    return {
        "formats": [
            {
                "format": "csv",
                "name": "CSV",
                "extensions": ["csv", "txt"],
                "description": "Comma-separated values",
                "maxSize": 500,
            },
            {
                "format": "xlsx",
                "name": "Excel (XLSX)",
                "extensions": ["xlsx"],
                "description": "Microsoft Excel 2007+",
                "maxSize": 100,
            },
            {
                "format": "json",
                "name": "JSON",
                "extensions": ["json"],
                "description": "JavaScript Object Notation",
                "maxSize": 200,
            },
            {
                "format": "parquet",
                "name": "Parquet",
                "extensions": ["parquet"],
                "description": "Apache Parquet columnar format",
                "maxSize": 1000,
            },
            # ... остальные форматы
        ]
    }

