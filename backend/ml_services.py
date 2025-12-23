"""
ML Services для Backend
Использование scikit-learn для более мощных ML задач
Работает локально, безопасно для РФ
"""

import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)


class MLAnomalyDetection:
    """Обнаружение аномалий с помощью scikit-learn"""
    
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
    
    def train(self, data: List[List[float]], contamination: float = 0.1):
        """
        Обучение модели для обнаружения аномалий
        
        Args:
            data: Массив массивов числовых значений
            contamination: Доля ожидаемых аномалий (0.0 - 0.5)
        """
        try:
            X = np.array(data)
            
            # Нормализация
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Обучение Isolation Forest
            self.model = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=100
            )
            self.model.fit(X_scaled)
            
            logger.info(f"Anomaly detection model trained on {len(data)} samples")
        except Exception as e:
            logger.error(f"Error training anomaly detection model: {e}")
            raise
    
    def predict(self, data: List[List[float]]) -> List[Dict[str, Any]]:
        """
        Предсказание аномалий
        
        Returns:
            Список словарей с информацией об аномалиях
        """
        if not self.model or not self.scaler:
            raise ValueError("Model not trained. Call train() first.")
        
        try:
            X = np.array(data)
            X_scaled = self.scaler.transform(X)
            
            predictions = self.model.predict(X_scaled)
            scores = self.model.score_samples(X_scaled)
            
            results = []
            for i, (pred, score) in enumerate(zip(predictions, scores)):
                results.append({
                    'index': i,
                    'is_anomaly': pred == -1,
                    'score': float(score),
                    'confidence': float(1 - abs(score) / max(abs(scores))) if len(scores) > 0 else 0.0
                })
            
            return results
        except Exception as e:
            logger.error(f"Error predicting anomalies: {e}")
            raise


class MLTimeSeriesForecast:
    """Прогнозирование временных рядов с помощью scikit-learn"""
    
    def __init__(self):
        self.model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.lookback: int = 10
    
    def train(self, data: List[float], lookback: int = 10):
        """
        Обучение модели для прогнозирования
        
        Args:
            data: Временной ряд
            lookback: Количество предыдущих значений для предсказания
        """
        try:
            self.lookback = lookback
            
            if len(data) < lookback * 2:
                raise ValueError(f"Need at least {lookback * 2} data points")
            
            # Подготовка данных (sliding window)
            X = []
            y = []
            
            for i in range(lookback, len(data)):
                X.append(data[i - lookback:i])
                y.append(data[i])
            
            X = np.array(X)
            y = np.array(y)
            
            # Нормализация
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            y_scaled = self.scaler.transform(y.reshape(-1, 1)).flatten()
            
            # Обучение Random Forest
            self.model = RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                max_depth=10
            )
            self.model.fit(X_scaled, y_scaled)
            
            # Вычисление метрик
            predictions = self.model.predict(X_scaled)
            mse = mean_squared_error(y_scaled, predictions)
            mae = mean_absolute_error(y_scaled, predictions)
            
            logger.info(f"Time series model trained. MSE: {mse:.4f}, MAE: {mae:.4f}")
            
        except Exception as e:
            logger.error(f"Error training time series model: {e}")
            raise
    
    def predict(self, data: List[float], steps: int = 1) -> Dict[str, Any]:
        """
        Прогнозирование
        
        Args:
            data: Последние значения временного ряда
            steps: Количество шагов вперед
        
        Returns:
            Словарь с прогнозами и метриками
        """
        if not self.model or not self.scaler:
            raise ValueError("Model not trained. Call train() first.")
        
        try:
            if len(data) < self.lookback:
                raise ValueError(f"Need at least {self.lookback} data points")
            
            predictions = []
            current_window = data[-self.lookback:]
            
            for _ in range(steps):
                X = np.array([current_window])
                X_scaled = self.scaler.transform(X)
                
                pred_scaled = self.model.predict(X_scaled)[0]
                
                # Денормализация (приблизительно)
                pred = pred_scaled * self.scaler.scale_[0] + self.scaler.mean_[0]
                predictions.append(float(pred))
                
                # Обновляем окно
                current_window = current_window[1:] + [pred]
            
            return {
                'predictions': predictions,
                'steps': steps,
                'confidence': 0.8  # Можно улучшить на основе метрик модели
            }
        except Exception as e:
            logger.error(f"Error predicting: {e}")
            raise


class MLClustering:
    """Кластеризация данных с помощью scikit-learn"""
    
    def __init__(self):
        self.model: Optional[Any] = None
        self.scaler: Optional[StandardScaler] = None
    
    def train_kmeans(self, data: List[List[float]], n_clusters: int = 3):
        """
        Обучение K-means модели
        
        Args:
            data: Массив массивов числовых значений
            n_clusters: Количество кластеров
        """
        try:
            X = np.array(data)
            
            # Нормализация
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Обучение K-means
            self.model = KMeans(
                n_clusters=n_clusters,
                random_state=42,
                n_init=10
            )
            self.model.fit(X_scaled)
            
            logger.info(f"K-means model trained with {n_clusters} clusters")
        except Exception as e:
            logger.error(f"Error training K-means model: {e}")
            raise
    
    def train_dbscan(self, data: List[List[float]], eps: float = 0.5, min_samples: int = 5):
        """
        Обучение DBSCAN модели
        
        Args:
            data: Массив массивов числовых значений
            eps: Максимальное расстояние между точками одного кластера
            min_samples: Минимальное количество точек для кластера
        """
        try:
            X = np.array(data)
            
            # Нормализация
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Обучение DBSCAN
            self.model = DBSCAN(eps=eps, min_samples=min_samples)
            self.model.fit(X_scaled)
            
            n_clusters = len(set(self.model.labels_)) - (1 if -1 in self.model.labels_ else 0)
            logger.info(f"DBSCAN model trained with {n_clusters} clusters")
        except Exception as e:
            logger.error(f"Error training DBSCAN model: {e}")
            raise
    
    def predict(self, data: List[List[float]]) -> List[Dict[str, Any]]:
        """
        Предсказание кластеров
        
        Returns:
            Список словарей с информацией о кластерах
        """
        if not self.model or not self.scaler:
            raise ValueError("Model not trained. Call train_kmeans() or train_dbscan() first.")
        
        try:
            X = np.array(data)
            X_scaled = self.scaler.transform(X)
            
            if hasattr(self.model, 'predict'):
                labels = self.model.predict(X_scaled)
            else:
                # DBSCAN не имеет predict, используем fit_predict
                labels = self.model.fit_predict(X_scaled)
            
            results = []
            for i, label in enumerate(labels):
                results.append({
                    'index': i,
                    'cluster': int(label),
                    'is_noise': label == -1
                })
            
            return results
        except Exception as e:
            logger.error(f"Error predicting clusters: {e}")
            raise


class MLPCA:
    """Анализ главных компонент (PCA) для снижения размерности"""
    
    def __init__(self):
        self.model: Optional[PCA] = None
        self.scaler: Optional[StandardScaler] = None
    
    def fit_transform(self, data: List[List[float]], n_components: Optional[int] = None) -> Dict[str, Any]:
        """
        Применение PCA
        
        Args:
            data: Массив массивов числовых значений
            n_components: Количество компонент (None = автоматически)
        
        Returns:
            Словарь с результатами PCA
        """
        try:
            X = np.array(data)
            
            # Нормализация
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # PCA
            if n_components is None:
                n_components = min(X.shape[1], X.shape[0] - 1)
            
            self.model = PCA(n_components=n_components)
            X_transformed = self.model.fit_transform(X_scaled)
            
            return {
                'transformed_data': X_transformed.tolist(),
                'explained_variance_ratio': self.model.explained_variance_ratio_.tolist(),
                'n_components': n_components,
                'total_variance_explained': float(sum(self.model.explained_variance_ratio_))
            }
        except Exception as e:
            logger.error(f"Error applying PCA: {e}")
            raise


# Экспорт классов
__all__ = [
    'MLAnomalyDetection',
    'MLTimeSeriesForecast',
    'MLClustering',
    'MLPCA'
]

