from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .medicine import Medicine

class StockBase(BaseModel):
    facility_id: int
    medicine_id: int
    current_quantity: int
    reorder_level: Optional[int] = 0

class StockCreate(StockBase):
    pass

class StockUpdate(BaseModel):
    current_quantity: int

class Stock(StockBase):
    id: int
    last_updated_time: datetime
    updated_by_user_id: Optional[int] = None
    medicine: Optional[Medicine] = None

    class Config:
        from_attributes = True
