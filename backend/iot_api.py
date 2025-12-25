"""
API для IoT интеграции
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/iot", tags=["iot"])


class IoTDevice(BaseModel):
    id: str
    name: str
    type: str
    status: str
    last_update: datetime
    data: Optional[Dict[str, Any]] = None


class SensorData(BaseModel):
    device_id: str
    timestamp: datetime
    metrics: Dict[str, float]
    location: Optional[Dict[str, float]] = None


# In-memory storage (в продакшене использовать БД)
iot_devices: Dict[str, IoTDevice] = {}
sensor_data: Dict[str, List[SensorData]] = {}


@router.get("/devices")
async def get_devices():
    """Получение списка IoT устройств"""
    return {"devices": list(iot_devices.values())}


@router.get("/devices/{device_id}/data")
async def get_device_data(
    device_id: str,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None
):
    """Получение данных с устройства"""
    if device_id not in sensor_data:
        raise HTTPException(status_code=404, detail="Device not found")
    
    data = sensor_data[device_id]
    
    if from_time or to_time:
        filtered = []
        for item in data:
            if from_time and item.timestamp < from_time:
                continue
            if to_time and item.timestamp > to_time:
                continue
            filtered.append(item)
        return {"data": filtered}
    
    return {"data": data}


@router.post("/devices/{device_id}/data")
async def post_device_data(device_id: str, data: SensorData):
    """Отправка данных с устройства"""
    if device_id not in sensor_data:
        sensor_data[device_id] = []
    
    sensor_data[device_id].append(data)
    
    # Ограничение размера истории (последние 1000 записей)
    if len(sensor_data[device_id]) > 1000:
        sensor_data[device_id] = sensor_data[device_id][-1000:]
    
    logger.info(f"Data received from device {device_id}")
    return {"status": "success"}

