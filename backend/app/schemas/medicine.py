from pydantic import BaseModel
from typing import Optional

class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    unit: str
    category: Optional[str] = None
    is_essential: Optional[bool] = False
    minimum_stock_rule: Optional[int] = 0

class MedicineCreate(MedicineBase):
    pass

class Medicine(MedicineBase):
    id: int

    class Config:
        from_attributes = True
