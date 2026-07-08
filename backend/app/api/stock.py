from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import stock as stock_schemas
from app.core import crud

router = APIRouter()


@router.get("/", response_model=List[stock_schemas.Stock])
def read_all_stock(skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    """B4 fix: list all stock across all facilities (for global dashboard view)."""
    return crud.get_all_stock(db, skip=skip, limit=limit)


@router.post("/update", response_model=stock_schemas.Stock)
def update_stock(
    stock_in: stock_schemas.StockCreate,
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(None, description="Mock Auth User ID"),
):
    """B1 fix: renamed from POST / to POST /update to avoid route conflict with GET /{facility_id}."""
    user_id = int(x_user_id) if x_user_id else 1  # Default to user 1 for easy testing
    stock = crud.update_stock(db, stock=stock_in, user_id=user_id)
    return stock


@router.get("/{facility_id}", response_model=List[stock_schemas.Stock])
def read_stock_for_facility(facility_id: int, db: Session = Depends(get_db)):
    stocks = crud.get_stock_for_facility(db, facility_id=facility_id)
    return stocks
