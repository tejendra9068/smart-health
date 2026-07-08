from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    generic_name = Column(String)
    unit = Column(String) # tablet, bottle, vial, strip, packet
    category = Column(String, nullable=True)
    is_essential = Column(Boolean, default=False)
    minimum_stock_rule = Column(Integer, default=0)
    
    # Relationships
    stocks = relationship("Stock", back_populates="medicine")
