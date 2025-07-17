from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime
import os

# PostgreSQL Database Setup
POSTGRES_URL = os.environ.get('POSTGRES_URL', 'postgresql://postgres:password@localhost:5432/media_trakker')
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Media Items Cache Table (replaces MongoDB)
class MediaItem(Base):
    __tablename__ = "media_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    external_id = Column(String, index=True)  # TMDB ID, AniList ID, etc.
    title = Column(String, index=True)
    media_type = Column(String, index=True)  # movie, tv, anime, manga, book
    year = Column(Integer, nullable=True)
    genres = Column(JSON, nullable=True)  # Store as JSON array
    poster_path = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    backdrop_path = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    release_date = Column(String, nullable=True)
    # Media-specific fields
    seasons = Column(Integer, nullable=True)
    episodes = Column(Integer, nullable=True)
    chapters = Column(Integer, nullable=True)
    volumes = Column(Integer, nullable=True)
    authors = Column(JSON, nullable=True)  # Store as JSON array
    publisher = Column(String, nullable=True)
    page_count = Column(Integer, nullable=True)
    # Games-specific fields
    platforms = Column(JSON, nullable=True)  # Store as JSON array
    developers = Column(JSON, nullable=True)  # Store as JSON array
    publishers = Column(JSON, nullable=True)  # Store as JSON array
    release_year = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)  # IGDB rating
    game_modes = Column(JSON, nullable=True)  # Store as JSON array
    additional_data = Column(JSON, nullable=True)  # Flexible field for any extra data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# User Lists Table
class UserList(Base):
    __tablename__ = "user_lists"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, default="demo_user")
    media_id = Column(String, index=True)  # References MediaItem.id
    media_type = Column(String, index=True)
    status = Column(String, index=True)  # watching, completed, paused, planning, dropped
    rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    progress = Column(JSON, nullable=True)  # JSON for flexible progress tracking
    started_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# User Preferences Table
class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, unique=True, default="demo_user")
    theme = Column(String, default="dark")  # light, dark
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