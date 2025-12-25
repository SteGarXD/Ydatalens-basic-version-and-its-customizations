"""
Интеграция backend кастомизаций с DataLens
Этот модуль обеспечивает правильную интеграцию backend кастомизаций в систему DataLens
"""

import logging
from typing import Optional, Any
from fastapi import APIRouter, FastAPI

logger = logging.getLogger(__name__)


def get_clickhouse_client():
    """
    Получить ClickHouse клиент из контекста DataLens
    
    Примечание: Это зависит от внутренней архитектуры DataLens.
    В реальной интеграции нужно использовать существующие механизмы DataLens
    для подключения к ClickHouse.
    """
    try:
        # Попытка получить клиент из контекста DataLens
        # Это пример - нужно адаптировать под реальную архитектуру DataLens
        
        # Вариант 1: Если DataLens использует глобальный клиент
        # from datalens.backend.core.clickhouse import get_client
        # return get_client()
        
        # Вариант 2: Если DataLens использует dependency injection
        # from datalens.backend.dependencies import get_clickhouse
        # return get_clickhouse()
        
        # Вариант 3: Если нужно создать новый клиент
        # from clickhouse_driver import Client
        # return Client(host='clickhouse', port=9000, database='default')
        
        logger.warning("ClickHouse client integration not implemented - using placeholder")
        return None
    except Exception as e:
        logger.error(f"Error getting ClickHouse client: {e}")
        return None


def get_us_client():
    """
    Получить UnitedStorage клиент из контекста DataLens
    
    UnitedStorage используется для работы с метаданными в DataLens
    """
    try:
        # Попытка получить US клиент из контекста DataLens
        # from datalens.backend.core.us import get_us_client
        # return get_us_client()
        
        logger.warning("US client integration not implemented - using placeholder")
        return None
    except Exception as e:
        logger.error(f"Error getting US client: {e}")
        return None


def register_customization_routers(app: FastAPI, prefix: str = "/api/v1"):
    """
    Регистрация роутеров кастомизаций в приложении DataLens
    
    Args:
        app: FastAPI приложение DataLens
        prefix: Префикс для API endpoints
    """
    try:
        from .file_upload_api import router as file_upload_router
        
        # Регистрируем роутер для загрузки файлов
        app.include_router(
            file_upload_router,
            prefix=prefix,
            tags=["customizations", "file-upload"]
        )
        
        # Регистрируем роутер для ML сервисов
        try:
            from .ml_api import router as ml_router
            app.include_router(
                ml_router,
                tags=["customizations", "ml"]
            )
            logger.info("ML routers registered successfully")
        except ImportError as e:
            logger.warning(f"ML routers not available (scikit-learn may not be installed): {e}")
        except Exception as e:
            logger.warning(f"Error registering ML routers: {e}")
        
        # Регистрируем роутер для алертов
        try:
            from .alerts_api import router as alerts_router
            app.include_router(
                alerts_router,
                tags=["customizations", "alerts"]
            )
            logger.info("Alerts routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering alerts routers: {e}")
        
        # Регистрируем роутер для планировщика отчетов
        try:
            from .scheduled_reports_api import router as reports_router
            app.include_router(
                reports_router,
                tags=["customizations", "reports"]
            )
            logger.info("Scheduled reports routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering scheduled reports routers: {e}")
        
        # Регистрируем роутер для Prescriptive Analytics
        try:
            from .prescriptive_api import router as prescriptive_router
            app.include_router(
                prescriptive_router,
                tags=["customizations", "prescriptive"]
            )
            logger.info("Prescriptive analytics routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering prescriptive routers: {e}")
        
        # Регистрируем роутер для IoT
        try:
            from .iot_api import router as iot_router
            app.include_router(
                iot_router,
                tags=["customizations", "iot"]
            )
            logger.info("IoT routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering IoT routers: {e}")
        
        # Регистрируем роутер для календарей
        try:
            from .calendar_api import router as calendar_router
            app.include_router(
                calendar_router,
                tags=["customizations", "calendar"]
            )
            logger.info("Calendar routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering calendar routers: {e}")
        
        # Регистрируем роутер для видео-отчетов
        try:
            from .video_reports_api import router as video_router
            app.include_router(
                video_router,
                tags=["customizations", "video"]
            )
            logger.info("Video reports routers registered successfully")
        except Exception as e:
            logger.warning(f"Error registering video reports routers: {e}")
        
        logger.info("Customization routers registered successfully")
    except Exception as e:
        logger.error(f"Error registering customization routers: {e}")
        raise


def initialize_customizations(app: FastAPI):
    """
    Инициализация всех backend кастомизаций
    
    Args:
        app: FastAPI приложение DataLens
    """
    try:
        logger.info("Initializing AeronavigatorBI backend customizations...")
        
        # Регистрируем роутеры
        register_customization_routers(app)
        
        # Инициализируем сервисы
        # Здесь можно добавить инициализацию других сервисов
        
        logger.info("AeronavigatorBI backend customizations initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing customizations: {e}")
        # Не прерываем запуск приложения при ошибке в кастомизациях


# Экспорт для использования в DataLens
__all__ = [
    'get_clickhouse_client',
    'get_us_client',
    'register_customization_routers',
    'initialize_customizations',
]

