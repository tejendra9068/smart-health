from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    facility_type = Column(String) # PHC or CHC
    district_id = Column(Integer, ForeignKey("districts.id"))
    address = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    total_beds = Column(Integer, default=0)
    contact_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    district = relationship("District", back_populates="facilities")
    users = relationship("User", back_populates="facility")
    stocks = relationship("Stock", back_populates="facility")
