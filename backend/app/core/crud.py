from sqlalchemy.orm import Session
from app import models, schemas

# Facilities
def get_facilities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Facility).offset(skip).limit(limit).all()

def get_facility(db: Session, facility_id: int):
    return db.query(models.Facility).filter(models.Facility.id == facility_id).first()

def create_facility(db: Session, facility: schemas.FacilityCreate):
    db_facility = models.Facility(**facility.model_dump())
    db.add(db_facility)
    db.commit()
    db.refresh(db_facility)
    return db_facility

# Medicines
def get_medicines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Medicine).offset(skip).limit(limit).all()

# Stocks
def get_stock_for_facility(db: Session, facility_id: int):
    return db.query(models.Stock).filter(models.Stock.facility_id == facility_id).all()

def get_all_stock(db: Session, skip: int = 0, limit: int = 500):
    return db.query(models.Stock).offset(skip).limit(limit).all()

def update_stock(db: Session, stock: schemas.StockCreate, user_id: int = 1):
    db_stock = db.query(models.Stock).filter(
        models.Stock.facility_id == stock.facility_id,
        models.Stock.medicine_id == stock.medicine_id
    ).first()
    
    if db_stock:
        db_stock.current_quantity = stock.current_quantity
        db_stock.reorder_level = stock.reorder_level
        db_stock.updated_by_user_id = user_id
    else:
        db_stock = models.Stock(
            facility_id=stock.facility_id,
            medicine_id=stock.medicine_id,
            current_quantity=stock.current_quantity,
            reorder_level=stock.reorder_level or 0,
            updated_by_user_id=user_id
        )
        db.add(db_stock)
    
    db.commit()
    db.refresh(db_stock)
    
    # Simple alert generation logic based on PRD FR-008
    # "If stock may finish in 7 days or less, create warning alert."
    # Since we don't have consumption data yet, let's use a simple absolute threshold for MVP
    medicine = db.query(models.Medicine).filter(models.Medicine.id == stock.medicine_id).first()
    if medicine and db_stock.current_quantity <= medicine.minimum_stock_rule:
        create_alert(db, schemas.AlertCreate(
            facility_id=stock.facility_id,
            alert_type="stock_critical",
            severity="critical",
            message=f"{medicine.name} stock is critically low ({db_stock.current_quantity} left)."
        ))

    return db_stock

# Alerts
def get_alerts(db: Session, facility_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Alert)
    if facility_id:
        query = query.filter(models.Alert.facility_id == facility_id)
    return query.offset(skip).limit(limit).all()

def create_alert(db: Session, alert: schemas.AlertCreate):
    # Check if a similar open alert already exists
    existing = db.query(models.Alert).filter(
        models.Alert.facility_id == alert.facility_id,
        models.Alert.alert_type == alert.alert_type,
        models.Alert.status == "open"
    ).first()
    
    if not existing:
        db_alert = models.Alert(**alert.model_dump())
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        return db_alert
    return existing

def resolve_alert(db: Session, alert_id: int):
    db_alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if db_alert:
        db_alert.status = "resolved"
        db.commit()
        db.refresh(db_alert)
    return db_alert
