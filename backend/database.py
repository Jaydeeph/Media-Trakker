from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

load_dotenv()

# MongoDB Setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# MongoDB Collections
media_items_collection = db.media_items
user_lists_collection = db.user_lists
user_preferences_collection = db.user_preferences

# Database functions
async def get_db():
    return db

async def create_tables():
    # MongoDB doesn't need table creation
    pass

# Helper functions for data operations
class MediaItem:
    def __init__(self, **kwargs):
        self.id = str(uuid.uuid4())
        self.external_id = kwargs.get('external_id')
        self.title = kwargs.get('title')
        self.media_type = kwargs.get('media_type')
        self.year = kwargs.get('year')
        self.genres = kwargs.get('genres', [])
        self.poster_path = kwargs.get('poster_path')
        self.overview = kwargs.get('overview')
        self.backdrop_path = kwargs.get('backdrop_path')
        self.vote_average = kwargs.get('vote_average')
        self.release_date = kwargs.get('release_date')
        self.seasons = kwargs.get('seasons')
        self.episodes = kwargs.get('episodes')
        self.chapters = kwargs.get('chapters')
        self.volumes = kwargs.get('volumes')
        self.authors = kwargs.get('authors', [])
        self.publisher = kwargs.get('publisher')
        self.page_count = kwargs.get('page_count')
        # Games-specific fields
        self.platforms = kwargs.get('platforms', [])
        self.developers = kwargs.get('developers', [])
        self.publishers = kwargs.get('publishers', [])
        self.release_year = kwargs.get('release_year')
        self.rating = kwargs.get('rating')
        self.game_modes = kwargs.get('game_modes', [])
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

class UserList:
    def __init__(self, **kwargs):
        self.id = str(uuid.uuid4())
        self.user_id = kwargs.get('user_id', 'demo_user')
        self.media_id = kwargs.get('media_id')
        self.media_type = kwargs.get('media_type')
        self.status = kwargs.get('status')
        self.rating = kwargs.get('rating')
        self.notes = kwargs.get('notes')
        self.progress = kwargs.get('progress')
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

class UserPreferences:
    def __init__(self, **kwargs):
        self.id = str(uuid.uuid4())
        self.user_id = kwargs.get('user_id', 'demo_user')
        self.theme = kwargs.get('theme', 'dark')
        self.language = kwargs.get('language', 'en')
        self.notifications_enabled = kwargs.get('notifications_enabled', True)
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()