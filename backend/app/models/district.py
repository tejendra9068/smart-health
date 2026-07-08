from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    state_name = Column(String)

    # Relationships
    users = relationship("User", back_populates="district")
    facilities = relationship("Facility", back_populates="district")
