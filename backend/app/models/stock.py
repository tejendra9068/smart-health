from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"))
    medicine_id = Column(Integer, ForeignKey("medicines.id"))
    current_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    last_updated_time = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    facility = relationship("Facility", back_populates="stocks")
    medicine = relationship("Medicine", back_populates="stocks")
    updated_by_user = relationship("User")
