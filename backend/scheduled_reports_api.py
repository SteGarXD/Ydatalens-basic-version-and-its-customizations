"""
API для планировщика отчетов (Scheduled Reports)
Автоматическая генерация и отправка отчетов по расписанию
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import logging
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    logging.warning("APScheduler not available. Scheduled reports will be limited.")
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["scheduled-reports"])

scheduler = AsyncIOScheduler() if APSCHEDULER_AVAILABLE else None


class ScheduledReportRequest(BaseModel):
    id: str
    name: str
    dashboard_id: Optional[str] = None
    query_id: Optional[str] = None
    format: str = "pdf"  # pdf, excel, png, html
    schedule: str  # Cron expression
    recipients: List[EmailStr]
    enabled: bool = True
    filters: Optional[Dict[str, Any]] = None


class ReportExecution(BaseModel):
    id: str
    report_id: str
    status: str  # pending, running, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    file_url: Optional[str] = None
    error: Optional[str] = None


# In-memory storage (в продакшене использовать БД)
scheduled_reports: Dict[str, ScheduledReportRequest] = {}
report_executions: Dict[str, ReportExecution] = {}


async def generate_report(report: ScheduledReportRequest) -> str:
    """Генерация отчета"""
    try:
        # Здесь должна быть логика генерации отчета из DataLens
        # Пока заглушка
        
        if report.dashboard_id:
            # Генерация отчета из дашборда
            file_url = f"/api/v1/reports/generated/{report.id}-{datetime.now().isoformat()}.{report.format}"
        elif report.query_id:
            # Генерация отчета из запроса
            file_url = f"/api/v1/reports/generated/{report.id}-{datetime.now().isoformat()}.{report.format}"
        else:
            raise ValueError("Either dashboard_id or query_id must be provided")
        
        return file_url
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise


async def send_report(report: ScheduledReportRequest, file_url: str):
    """Отправка отчета получателям"""
    try:
        from .alerts_api import send_email_notification, AlertNotificationRequest
        
        # Отправка отчета по email
        notification = AlertNotificationRequest(
            recipients=report.recipients,
            subject=f"Отчет: {report.name}",
            message=f"Автоматически сгенерированный отчет '{report.name}' во вложении.",
            severity="info",
            data={"file_url": file_url}
        )
        
        await send_email_notification(notification)
        logger.info(f"Report sent to {len(report.recipients)} recipients")
    except Exception as e:
        logger.error(f"Error sending report: {e}")
        raise


async def execute_report(report_id: str):
    """Выполнение запланированного отчета"""
    report = scheduled_reports.get(report_id)
    if not report or not report.enabled:
        return

    execution_id = f"{report_id}-{datetime.now().isoformat()}"
    execution = ReportExecution(
        id=execution_id,
        report_id=report_id,
        status="running",
        started_at=datetime.now()
    )
    report_executions[execution_id] = execution

    try:
        # Генерация отчета
        file_url = await generate_report(report)
        
        # Отправка отчета
        await send_report(report, file_url)
        
        execution.status = "completed"
        execution.completed_at = datetime.now()
        execution.file_url = file_url
        
        logger.info(f"Report executed successfully: {report.name}")
    except Exception as e:
        execution.status = "failed"
        execution.completed_at = datetime.now()
        execution.error = str(e)
        logger.error(f"Report execution failed: {e}")


@router.post("/schedule")
async def schedule_report(report: ScheduledReportRequest):
    """Создание запланированного отчета"""
    try:
        scheduled_reports[report.id] = report
        
        if report.enabled and scheduler:
            # Парсинг cron выражения и добавление задачи
            trigger = CronTrigger.from_crontab(report.schedule)
            scheduler.add_job(
                execute_report,
                trigger=trigger,
                args=[report.id],
                id=report.id,
                replace_existing=True
            )
        
        logger.info(f"Scheduled report created: {report.name} ({report.schedule})")
        return {"status": "success", "report_id": report.id}
    except Exception as e:
        logger.error(f"Error scheduling report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scheduled")
async def get_scheduled_reports():
    """Получение всех запланированных отчетов"""
    return {"reports": list(scheduled_reports.values())}


@router.post("/{report_id}/execute")
async def execute_report_now(report_id: str):
    """Немедленное выполнение отчета"""
    if report_id not in scheduled_reports:
        raise HTTPException(status_code=404, detail="Report not found")
    
    await execute_report(report_id)
    return {"status": "success"}


@router.delete("/{report_id}")
async def delete_scheduled_report(report_id: str):
    """Удаление запланированного отчета"""
    if report_id not in scheduled_reports:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Удаление задачи из планировщика
    try:
        scheduler.remove_job(report_id)
    except:
        pass
    
    del scheduled_reports[report_id]
    return {"status": "success"}


@router.on_event("startup")
async def start_scheduler():
    """Запуск планировщика при старте приложения"""
    if not scheduler:
        logger.warning("Scheduler not available (APScheduler not installed)")
        return
    
    scheduler.start()
    logger.info("Report scheduler started")
    
    # Восстановление всех активных отчетов
    for report_id, report in scheduled_reports.items():
        if report.enabled:
            try:
                trigger = CronTrigger.from_crontab(report.schedule)
                scheduler.add_job(
                    execute_report,
                    trigger=trigger,
                    args=[report_id],
                    id=report_id,
                    replace_existing=True
                )
            except Exception as e:
                logger.error(f"Error restoring scheduled report {report_id}: {e}")


@router.on_event("shutdown")
async def shutdown_scheduler():
    """Остановка планировщика при остановке приложения"""
    if scheduler:
        scheduler.shutdown()
        logger.info("Report scheduler stopped")

