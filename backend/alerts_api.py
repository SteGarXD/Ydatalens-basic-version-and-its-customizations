"""
API для автоматических алертов и уведомлений
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


class AlertRuleRequest(BaseModel):
    id: str
    name: str
    condition: Dict[str, Any]
    channels: List[str]
    recipients: Optional[List[str]] = None
    webhookUrl: Optional[str] = None
    enabled: bool = True
    cooldown: Optional[int] = None


class AlertNotificationRequest(BaseModel):
    recipients: List[EmailStr]
    subject: str
    message: str
    severity: str
    data: Optional[Dict[str, Any]] = None


class TelegramNotificationRequest(BaseModel):
    chatIds: List[str]
    message: str
    severity: str


# In-memory storage (в продакшене использовать БД)
alert_rules: Dict[str, AlertRuleRequest] = {}


@router.post("/rules")
async def create_alert_rule(rule: AlertRuleRequest):
    """Создание правила алерта"""
    try:
        alert_rules[rule.id] = rule
        logger.info(f"Alert rule created: {rule.name}")
        return {"status": "success", "rule_id": rule.id}
    except Exception as e:
        logger.error(f"Error creating alert rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rules")
async def get_alert_rules():
    """Получение всех правил алертов"""
    return {"rules": list(alert_rules.values())}


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: str):
    """Удаление правила алерта"""
    if rule_id not in alert_rules:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    del alert_rules[rule_id]
    return {"status": "success"}


@router.post("/notify/email")
async def send_email_notification(request: AlertNotificationRequest):
    """Отправка Email уведомления"""
    try:
        smtp_host = os.getenv("SMTP_HOST", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", "alerts@aeronavigator.ru")

        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = ", ".join(request.recipients)
        msg['Subject'] = request.subject

        body = f"""
        {request.message}
        
        Серьезность: {request.severity}
        Время: {datetime.now().isoformat()}
        """
        
        if request.data:
            body += f"\n\nДанные:\n{json.dumps(request.data, indent=2, ensure_ascii=False)}"

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if smtp_user and smtp_password:
                server.starttls()
                server.login(smtp_user, smtp_password)
            server.send_message(msg)

        logger.info(f"Email notification sent to {len(request.recipients)} recipients")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/telegram")
async def send_telegram_notification(request: TelegramNotificationRequest):
    """Отправка Telegram уведомления"""
    try:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        if not bot_token:
            raise HTTPException(status_code=500, detail="Telegram bot token not configured")

        for chat_id in request.chatIds:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": request.message,
                "parse_mode": "Markdown"
            }
            
            response = requests.post(url, json=payload)
            if response.status_code != 200:
                logger.warning(f"Failed to send Telegram message to {chat_id}")

        logger.info(f"Telegram notification sent to {len(request.chatIds)} chats")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Подтверждение алерта"""
    # В продакшене сохранять в БД
    return {"status": "success", "alert_id": alert_id}

