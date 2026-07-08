from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import facility as facility_schemas
from app.core import crud

router = APIRouter()


@router.get("/", response_model=List[facility_schemas.Facility])
def read_facilities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    facilities = crud.get_facilities(db, skip=skip, limit=limit)
    return facilities


@router.post("/", response_model=facility_schemas.Facility, status_code=201)
def create_facility(
    facility_in: facility_schemas.FacilityCreate,
    db: Session = Depends(get_db),
):
    """B3 fix: create a new facility."""
    return crud.create_facility(db, facility=facility_in)


@router.get("/{facility_id}", response_model=facility_schemas.Facility)
def read_facility(facility_id: int, db: Session = Depends(get_db)):
    db_facility = crud.get_facility(db, facility_id=facility_id)
    if db_facility is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    return db_facility
