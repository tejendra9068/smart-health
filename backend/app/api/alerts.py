from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import alert as alert_schemas
from app.core import crud

router = APIRouter()


@router.post("/", response_model=alert_schemas.Alert, status_code=201)
def create_alert(
    alert_in: alert_schemas.AlertCreate,
    db: Session = Depends(get_db),
):
    """Create a new alert manually (e.g. patient intake event from web-app)."""
    return crud.create_alert(db, alert=alert_in)


@router.get("/", response_model=List[alert_schemas.Alert])
def read_alerts(
    facility_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    alerts = crud.get_alerts(db, facility_id=facility_id, skip=skip, limit=limit)
    return alerts


@router.patch("/{alert_id}/resolve", response_model=alert_schemas.Alert)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """B2 fix: resolve/close an alert by ID."""
    db_alert = crud.resolve_alert(db, alert_id=alert_id)
    if db_alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return db_alert
