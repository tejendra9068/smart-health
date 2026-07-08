from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import facilities, stock, alerts
from app.database import engine
from app import models

# Ensure all tables are created on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Health API",
    description="API for the Smart Health Center and Supply Chain Management Platform",
    version="1.0.0"
)

# B6 fix: Expanded CORS origins to cover all local dev ports
origins = [
    "http://localhost:3000",  # Next.js dashboard
    "http://localhost:3001",
    "http://localhost:5173",  # Vite web-app
    "http://localhost:5174",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(facilities.router, prefix="/api/facilities", tags=["Facilities"])
app.include_router(stock.router, prefix="/api/stock", tags=["Stock"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Health API. Visit /docs for documentation."}
