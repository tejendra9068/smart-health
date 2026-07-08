from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    role = Column(String) # facility_staff, doctor, facility_manager, district_admin, state_admin, system_admin
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    preferred_language = Column(String, default="en")
    is_active = Column(Boolean, default=True)

    # Relationships
    facility = relationship("Facility", back_populates="users")
    district = relationship("District", back_populates="users")
