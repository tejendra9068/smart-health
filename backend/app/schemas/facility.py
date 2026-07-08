from pydantic import BaseModel
from typing import Optional, List

class FacilityBase(BaseModel):
    name: str
    facility_type: str
    district_id: int
    address: Optional[str] = None
    total_beds: Optional[int] = 0
    contact_number: Optional[str] = None
    is_active: Optional[bool] = True

class FacilityCreate(FacilityBase):
    pass

class Facility(FacilityBase):
    id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
