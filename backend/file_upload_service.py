"""
Backend сервис для загрузки файлов любого формата в DataLens
Поддержка CSV, Excel, JSON, XML, Parquet, Avro, ORC, PDF, HTML и других форматов
"""

import os
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import pandas as pd
import pyarrow.parquet as pq
import pyarrow as pa
from fastapi import UploadFile, HTTPException
import json
import xml.etree.ElementTree as ET
from io import BytesIO
import chardet

logger = logging.getLogger(__name__)


class FileUploadService:
    """Сервис для загрузки и обработки файлов различных форматов"""

    SUPPORTED_FORMATS = {
        'csv': {'extensions': ['.csv', '.txt'], 'max_size_mb': 500},
        'tsv': {'extensions': ['.tsv'], 'max_size_mb': 500},
        'xlsx': {'extensions': ['.xlsx'], 'max_size_mb': 100},
        'xls': {'extensions': ['.xls'], 'max_size_mb': 50},
        'ods': {'extensions': ['.ods'], 'max_size_mb': 100},
        'json': {'extensions': ['.json'], 'max_size_mb': 200},
        'xml': {'extensions': ['.xml'], 'max_size_mb': 200},
        'parquet': {'extensions': ['.parquet'], 'max_size_mb': 1000},
        'avro': {'extensions': ['.avro'], 'max_size_mb': 1000},
        'orc': {'extensions': ['.orc'], 'max_size_mb': 1000},
        'pdf': {'extensions': ['.pdf'], 'max_size_mb': 50},
        'html': {'extensions': ['.html', '.htm'], 'max_size_mb': 50},
    }

    def __init__(self, clickhouse_client, temp_dir: str = '/tmp/datalens_uploads'):
        self.clickhouse_client = clickhouse_client
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def detect_format(self, filename: str, content: bytes) -> str:
        """Автоматическое определение формата файла"""
        extension = Path(filename).suffix.lower()
        
        # Проверка по расширению
        for format_name, info in self.SUPPORTED_FORMATS.items():
            if extension in info['extensions']:
                return format_name
        
        # Проверка по содержимому
        if content.startswith(b'{') or content.startswith(b'['):
            return 'json'
        elif content.startswith(b'<?xml') or content.startswith(b'<'):
            return 'xml'
        elif b'\x89PNG' in content[:16]:
            return 'pdf'  # Может быть PDF с PNG заголовком
        
        return 'csv'  # По умолчанию

    def read_csv(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение CSV файла"""
        encoding = options.get('encoding')
        if not encoding:
            # Автоопределение кодировки
            detected = chardet.detect(file_content)
            encoding = detected.get('encoding', 'utf-8')
        
        delimiter = options.get('delimiter', ',')
        if delimiter == '\\t':
            delimiter = '\t'
        
        df = pd.read_csv(
            BytesIO(file_content),
            encoding=encoding,
            delimiter=delimiter,
            skiprows=options.get('skipRows', 0),
            header=options.get('headerRow', 0),
            decimal=options.get('decimalSeparator', '.'),
            thousands=options.get('thousandsSeparator', ''),
            quotechar=options.get('quoteChar', '"'),
            escapechar=options.get('escapeChar', '\\'),
            low_memory=False,
        )
        return df

    def read_excel(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение Excel файла"""
        sheet_name = options.get('sheetName', 0)
        header_row = options.get('headerRow', 0)
        
        df = pd.read_excel(
            BytesIO(file_content),
            sheet_name=sheet_name,
            header=header_row,
            engine='openpyxl' if file_content[:2] == b'PK' else 'xlrd',
        )
        return df

    def read_json(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение JSON файла"""
        content_str = file_content.decode('utf-8')
        data = json.loads(content_str)
        
        # Если это массив объектов
        if isinstance(data, list):
            return pd.DataFrame(data)
        # Если это объект с массивом
        elif isinstance(data, dict):
            # Попытаться найти массив в объекте
            for key, value in data.items():
                if isinstance(value, list):
                    return pd.DataFrame(value)
            # Если не найден массив, создать DataFrame из объекта
            return pd.DataFrame([data])
        else:
            raise ValueError("JSON должен содержать массив объектов или объект с массивом")

    def read_xml(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение XML файла"""
        content_str = file_content.decode('utf-8')
        root = ET.fromstring(content_str)
        
        # Попытаться найти таблицу в XML
        rows = []
        for item in root.iter():
            if item.tag not in [root.tag]:
                row = {}
                for child in item:
                    row[child.tag] = child.text
                if row:
                    rows.append(row)
        
        if not rows:
            raise ValueError("Не удалось найти табличные данные в XML")
        
        return pd.DataFrame(rows)

    def read_parquet(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение Parquet файла"""
        table = pq.read_table(BytesIO(file_content))
        return table.to_pandas()

    def read_pdf(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение таблиц из PDF файла"""
        try:
            import tabula
            dfs = tabula.read_pdf(BytesIO(file_content), pages='all', multiple_tables=True)
            if dfs:
                # Объединить все таблицы
                return pd.concat(dfs, ignore_index=True)
            else:
                raise ValueError("Не найдено таблиц в PDF")
        except ImportError:
            raise ValueError("Для чтения PDF требуется библиотека tabula-py")

    def read_html(self, file_content: bytes, options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение таблиц из HTML файла"""
        content_str = file_content.decode('utf-8')
        dfs = pd.read_html(content_str)
        if dfs:
            # Вернуть первую таблицу или объединить все
            return pd.concat(dfs, ignore_index=True) if len(dfs) > 1 else dfs[0]
        else:
            raise ValueError("Не найдено таблиц в HTML")

    def read_file(self, file_content: bytes, filename: str, format_name: Optional[str], options: Dict[str, Any]) -> pd.DataFrame:
        """Чтение файла любого поддерживаемого формата"""
        if not format_name:
            format_name = self.detect_format(filename, file_content)
        
        format_name = format_name.lower()
        
        readers = {
            'csv': self.read_csv,
            'tsv': self.read_csv,
            'xlsx': self.read_excel,
            'xls': self.read_excel,
            'ods': self.read_excel,
            'json': self.read_json,
            'xml': self.read_xml,
            'parquet': self.read_parquet,
            'pdf': self.read_pdf,
            'html': self.read_html,
        }
        
        if format_name not in readers:
            raise ValueError(f"Формат {format_name} не поддерживается")
        
        # Настройка опций для TSV
        if format_name == 'tsv':
            options = {**options, 'delimiter': '\t'}
        
        try:
            df = readers[format_name](file_content, options)
            return df
        except Exception as e:
            logger.error(f"Ошибка чтения файла {filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Ошибка чтения файла: {str(e)}")

    def auto_detect_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Автоматическое определение типов данных"""
        for col in df.columns:
            # Попытка преобразовать в числовой тип
            try:
                df[col] = pd.to_numeric(df[col], errors='ignore')
            except:
                pass
            
            # Попытка преобразовать в дату
            try:
                df[col] = pd.to_datetime(df[col], errors='ignore')
            except:
                pass
        
        return df

    def upload_to_clickhouse(
        self, 
        df: pd.DataFrame, 
        table_name: str,
        database: str = 'datalens_uploads'
    ) -> Tuple[str, int]:
        """Загрузка DataFrame в ClickHouse"""
        # Создать базу данных, если не существует
        self.clickhouse_client.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
        
        # Определить типы колонок для ClickHouse
        column_types = {}
        for col in df.columns:
            dtype = df[col].dtype
            if pd.api.types.is_integer_dtype(dtype):
                column_types[col] = 'Int64'
            elif pd.api.types.is_float_dtype(dtype):
                column_types[col] = 'Float64'
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                column_types[col] = 'DateTime'
            elif pd.api.types.is_bool_dtype(dtype):
                column_types[col] = 'Bool'
            else:
                column_types[col] = 'String'
        
        # Создать таблицу
        columns_def = ', '.join([f"{col} {dtype}" for col, dtype in column_types.items()])
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {database}.{table_name} (
            {columns_def}
        ) ENGINE = MergeTree()
        ORDER BY tuple()
        """
        self.clickhouse_client.execute(create_table_query)
        
        # Загрузить данные
        # Преобразовать DataFrame в формат для ClickHouse
        rows = df.to_dict('records')
        self.clickhouse_client.execute(
            f"INSERT INTO {database}.{table_name} VALUES",
            rows
        )
        
        return f"{database}.{table_name}", len(df)

    async def process_upload(
        self,
        file: UploadFile,
        dataset_name: str,
        format_name: Optional[str] = None,
        parse_options: Optional[Dict[str, Any]] = None,
        auto_detect_types: bool = True,
    ) -> Dict[str, Any]:
        """Обработка загруженного файла"""
        # Читать содержимое файла
        content = await file.read()
        
        # Валидация размера
        file_size_mb = len(content) / (1024 * 1024)
        detected_format = format_name or self.detect_format(file.filename, content)
        max_size = self.SUPPORTED_FORMATS.get(detected_format, {}).get('max_size_mb', 100)
        
        if file_size_mb > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Размер файла ({file_size_mb:.2f} MB) превышает максимальный ({max_size} MB)"
            )
        
        # Чтение файла
        df = self.read_file(content, file.filename, format_name, parse_options or {})
        
        # Автоопределение типов
        if auto_detect_types:
            df = self.auto_detect_types(df)
        
        # Загрузка в ClickHouse
        table_name = f"dataset_{dataset_name.lower().replace(' ', '_')}"
        full_table_name, row_count = self.upload_to_clickhouse(df, table_name)
        
        # Получить информацию о колонках
        columns = [
            {
                'name': col,
                'type': str(df[col].dtype),
                'sampleValues': df[col].head(5).tolist(),
            }
            for col in df.columns
        ]
        
        return {
            'datasetId': full_table_name,
            'tableName': full_table_name,
            'rowCount': row_count,
            'columns': columns,
            'format': detected_format,
        }

    async def preview_file(
        self,
        file: UploadFile,
        format_name: Optional[str] = None,
        parse_options: Optional[Dict[str, Any]] = None,
        preview_rows: int = 10,
    ) -> Dict[str, Any]:
        """Предпросмотр файла перед загрузкой"""
        content = await file.read()
        
        # Чтение файла
        df = self.read_file(content, file.filename, format_name, parse_options or {})
        
        # Получить информацию о колонках
        columns = []
        for col in df.columns:
            dtype = df[col].dtype
            if pd.api.types.is_integer_dtype(dtype):
                col_type = 'number'
            elif pd.api.types.is_float_dtype(dtype):
                col_type = 'number'
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                col_type = 'date'
            elif pd.api.types.is_bool_dtype(dtype):
                col_type = 'boolean'
            else:
                col_type = 'string'
            
            columns.append({
                'name': col,
                'type': col_type,
                'sampleValues': df[col].head(5).tolist(),
            })
        
        return {
            'columns': columns,
            'rowCount': len(df),
            'previewData': df.head(preview_rows).to_dict('records'),
        }

