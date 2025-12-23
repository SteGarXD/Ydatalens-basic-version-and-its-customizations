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
        
        # Инициализация сервиса
        # Примечание: ClickHouse клиент должен быть получен из контекста DataLens
        # Для интеграции с DataLens нужно использовать существующие механизмы подключения
        try:
            from .file_upload_service import FileUploadService
            
            # TODO: Получить ClickHouse клиент из контекста DataLens
            # clickhouse_client = get_clickhouse_client()  # Нужно реализовать
            # service = FileUploadService(clickhouse_client)
            
            # Временная реализация без ClickHouse (для тестирования)
            # В production нужно интегрировать с реальным ClickHouse клиентом DataLens
            return {
                "datasetId": f"temp_{datasetName}",
                "rowCount": 0,
                "columns": [],
                "message": "ClickHouse integration required - use DataLens connection mechanisms"
            }
        except ImportError:
            raise HTTPException(status_code=500, detail="FileUploadService not available")
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
            
            # TODO: Получить ClickHouse клиент из контекста DataLens
            # clickhouse_client = get_clickhouse_client()
            # service = FileUploadService(clickhouse_client)
            # result = await service.preview_file(file, format, parse_options, previewRows)
            
            # Временная реализация
            return {
                "columns": [],
                "rowCount": 0,
                "previewData": [],
                "message": "ClickHouse integration required - use DataLens connection mechanisms"
            }
        except ImportError:
            raise HTTPException(status_code=500, detail="FileUploadService not available")
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

