"""
API endpoints для ML сервисов
Интеграция scikit-learn ML функций в DataLens
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from .ml_services import (
    MLAnomalyDetection,
    MLTimeSeriesForecast,
    MLClustering,
    MLPCA
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ml", tags=["ml"])


# Pydantic модели для запросов
class AnomalyDetectionRequest(BaseModel):
    data: List[List[float]]
    contamination: float = 0.1


class TimeSeriesForecastRequest(BaseModel):
    data: List[float]
    lookback: int = 10
    steps: int = 1


class ClusteringRequest(BaseModel):
    data: List[List[float]]
    method: str = "kmeans"  # "kmeans" or "dbscan"
    n_clusters: int = 3
    eps: float = 0.5
    min_samples: int = 5


class PCARequest(BaseModel):
    data: List[List[float]]
    n_components: Optional[int] = None


# Глобальные экземпляры моделей (в продакшене лучше использовать кэш или БД)
_anomaly_models: Dict[str, MLAnomalyDetection] = {}
_forecast_models: Dict[str, MLTimeSeriesForecast] = {}
_clustering_models: Dict[str, MLClustering] = {}


@router.post("/anomaly-detection/train")
async def train_anomaly_detection(
    request: AnomalyDetectionRequest,
    model_id: str = "default"
):
    """
    Обучение модели для обнаружения аномалий
    """
    try:
        model = MLAnomalyDetection()
        model.train(request.data, request.contamination)
        _anomaly_models[model_id] = model
        
        return {
            "status": "success",
            "model_id": model_id,
            "samples": len(request.data),
            "contamination": request.contamination
        }
    except Exception as e:
        logger.error(f"Error training anomaly detection model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anomaly-detection/predict")
async def predict_anomalies(
    data: List[List[float]],
    model_id: str = "default"
):
    """
    Предсказание аномалий
    """
    try:
        if model_id not in _anomaly_models:
            raise HTTPException(
                status_code=404,
                detail=f"Model {model_id} not found. Train it first."
            )
        
        model = _anomaly_models[model_id]
        results = model.predict(data)
        
        return {
            "status": "success",
            "predictions": results,
            "total_anomalies": sum(1 for r in results if r['is_anomaly'])
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/time-series/train")
async def train_time_series(
    request: TimeSeriesForecastRequest,
    model_id: str = "default"
):
    """
    Обучение модели для прогнозирования временных рядов
    """
    try:
        model = MLTimeSeriesForecast()
        model.train(request.data, request.lookback)
        _forecast_models[model_id] = model
        
        return {
            "status": "success",
            "model_id": model_id,
            "data_points": len(request.data),
            "lookback": request.lookback
        }
    except Exception as e:
        logger.error(f"Error training time series model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/time-series/predict")
async def predict_time_series(
    request: TimeSeriesForecastRequest,
    model_id: str = "default"
):
    """
    Прогнозирование временного ряда
    """
    try:
        if model_id not in _forecast_models:
            raise HTTPException(
                status_code=404,
                detail=f"Model {model_id} not found. Train it first."
            )
        
        model = _forecast_models[model_id]
        result = model.predict(request.data, request.steps)
        
        return {
            "status": "success",
            "predictions": result["predictions"],
            "steps": result["steps"],
            "confidence": result["confidence"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting time series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clustering/train")
async def train_clustering(
    request: ClusteringRequest,
    model_id: str = "default"
):
    """
    Обучение модели кластеризации
    """
    try:
        model = MLClustering()
        
        if request.method == "kmeans":
            model.train_kmeans(request.data, request.n_clusters)
        elif request.method == "dbscan":
            model.train_dbscan(request.data, request.eps, request.min_samples)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown method: {request.method}. Use 'kmeans' or 'dbscan'"
            )
        
        _clustering_models[model_id] = model
        
        return {
            "status": "success",
            "model_id": model_id,
            "method": request.method,
            "samples": len(request.data)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training clustering model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clustering/predict")
async def predict_clusters(
    data: List[List[float]],
    model_id: str = "default"
):
    """
    Предсказание кластеров
    """
    try:
        if model_id not in _clustering_models:
            raise HTTPException(
                status_code=404,
                detail=f"Model {model_id} not found. Train it first."
            )
        
        model = _clustering_models[model_id]
        results = model.predict(data)
        
        return {
            "status": "success",
            "predictions": results,
            "n_clusters": len(set(r['cluster'] for r in results if not r['is_noise']))
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pca/transform")
async def apply_pca(request: PCARequest):
    """
    Применение PCA для снижения размерности
    """
    try:
        pca = MLPCA()
        result = pca.fit_transform(request.data, request.n_components)
        
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        logger.error(f"Error applying PCA: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models():
    """
    Список обученных моделей
    """
    return {
        "anomaly_detection": list(_anomaly_models.keys()),
        "time_series": list(_forecast_models.keys()),
        "clustering": list(_clustering_models.keys())
    }


@router.delete("/models/{model_type}/{model_id}")
async def delete_model(model_type: str, model_id: str):
    """
    Удаление обученной модели
    """
    try:
        if model_type == "anomaly":
            if model_id in _anomaly_models:
                del _anomaly_models[model_id]
                return {"status": "success", "message": f"Model {model_id} deleted"}
        elif model_type == "time-series":
            if model_id in _forecast_models:
                del _forecast_models[model_id]
                return {"status": "success", "message": f"Model {model_id} deleted"}
        elif model_type == "clustering":
            if model_id in _clustering_models:
                del _clustering_models[model_id]
                return {"status": "success", "message": f"Model {model_id} deleted"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")
        
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

