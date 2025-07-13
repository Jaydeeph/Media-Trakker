from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import os

# PostgreSQL Database Setup
POSTGRES_URL = os.environ.get('POSTGRES_URL', 'postgresql://postgres:password@localhost:5432/media_trakker')
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Lists Table
class UserList(Base):
    __tablename__ = "user_lists"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, default="demo_user")  # For now, using demo user
    media_id = Column(String, index=True)
    media_type = Column(String, index=True)  # movie, tv, anime, manga, book
    status = Column(String, index=True)  # watching, completed, paused, planning, dropped
    rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    progress = Column(Text, nullable=True)  # JSON string for flexible progress tracking
    started_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# User Preferences Table
class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, unique=True, default="demo_user")
    theme = Column(String, default="light")  # light, dark
    language = Column(String, default="en")
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()