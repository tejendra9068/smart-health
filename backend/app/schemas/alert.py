from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .facility import Facility

class AlertBase(BaseModel):
    facility_id: int
    alert_type: str
    severity: str
    message: str
    status: Optional[str] = "open"

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    created_time: datetime
    assigned_admin_id: Optional[int] = None
    facility: Optional[Facility] = None

    class Config:
        from_attributes = True
