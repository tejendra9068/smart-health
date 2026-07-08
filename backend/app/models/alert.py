from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"))
    alert_type = Column(String) # stock_warning, stock_critical, stock_emergency, etc.
    severity = Column(String) # info, warning, critical, emergency
    message = Column(String)
    status = Column(String, default="open") # open, reviewed, action_taken, closed
    created_time = Column(DateTime(timezone=True), server_default=func.now())
    assigned_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    facility = relationship("Facility")
    assigned_admin = relationship("User")
