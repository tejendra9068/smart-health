from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
import random

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(models.District).first():
        print("Data already seeded.")
        return

    print("Seeding database with mock data...")

    # Create District
    district = models.District(name="Rampur", state_name="Uttar Pradesh")
    db.add(district)
    db.commit()
    db.refresh(district)

    # Create Facilities
    facilities = [
        models.Facility(name="PHC Rampur Main", facility_type="PHC", district_id=district.id, total_beds=10, latitude=28.815, longitude=79.025),
        models.Facility(name="CHC Bilaspur", facility_type="CHC", district_id=district.id, total_beds=50, latitude=28.89, longitude=79.27),
        models.Facility(name="PHC Milak", facility_type="PHC", district_id=district.id, total_beds=8, latitude=28.61, longitude=79.17)
    ]
    db.add_all(facilities)
    db.commit()

    # Create Users
    users = [
        models.User(username="admin_rampur", phone_number="9999999999", role="district_admin", district_id=district.id, hashed_password="mock_hash"),
        models.User(username="staff_phc1", phone_number="8888888888", role="facility_staff", facility_id=facilities[0].id, hashed_password="mock_hash"),
        models.User(username="staff_chc1", phone_number="7777777777", role="facility_staff", facility_id=facilities[1].id, hashed_password="mock_hash")
    ]
    db.add_all(users)
    db.commit()

    # Create Medicines
    medicines = [
        models.Medicine(name="Paracetamol 500mg", unit="tablet", is_essential=True, minimum_stock_rule=1000),
        models.Medicine(name="ORS Packet", unit="packet", is_essential=True, minimum_stock_rule=500),
        models.Medicine(name="Amoxicillin 250mg", unit="capsule", is_essential=True, minimum_stock_rule=800)
    ]
    db.add_all(medicines)
    db.commit()

    # Create initial Stock
    stocks = []
    for f in facilities:
        for m in medicines:
            # Randomize some stocks to be critically low for alerts testing
            qty = random.randint(100, 3000)
            if m.name == "Paracetamol 500mg" and f.name == "PHC Milak":
                qty = 50 # Critically low
            
            stocks.append(models.Stock(
                facility_id=f.id,
                medicine_id=m.id,
                current_quantity=qty,
                reorder_level=m.minimum_stock_rule,
                updated_by_user_id=2 # Mocking staff_phc1 as updater
            ))
    
    db.add_all(stocks)
    db.commit()

    # Create sample alert for the low stock
    phc_milak = db.query(models.Facility).filter(models.Facility.name == "PHC Milak").first()
    alert = models.Alert(
        facility_id=phc_milak.id,
        alert_type="stock_critical",
        severity="critical",
        message="Paracetamol 500mg stock is critically low (50 left)."
    )
    db.add(alert)
    db.commit()

    print("Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_data()
