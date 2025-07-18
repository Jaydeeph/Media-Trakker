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

def create_tables():
    # MongoDB doesn't need table creation
    pass