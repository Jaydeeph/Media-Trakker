from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# TMDB Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Pydantic Models
class MediaItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tmdb_id: int
    title: str
    media_type: str  # 'movie' or 'tv'
    year: Optional[int] = None
    genres: List[str] = []
    poster_path: Optional[str] = None
    overview: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    release_date: Optional[str] = None
    # TV Show specific fields
    seasons: Optional[int] = None
    episodes: Optional[int] = None
    last_episode_to_air: Optional[Dict] = None
    next_episode_to_air: Optional[Dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserListItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    media_id: str
    media_type: str
    status: str  # 'watching', 'completed', 'paused', 'planning', 'dropped'
    progress: Optional[Dict] = None  # {'season': 1, 'episode': 5} for TV shows
    rating: Optional[float] = None
    notes: Optional[str] = None
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserListItemCreate(BaseModel):
    media_id: str
    media_type: str
    status: str
    progress: Optional[Dict] = None
    rating: Optional[float] = None
    notes: Optional[str] = None

class UserListItemUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[Dict] = None
    rating: Optional[float] = None
    notes: Optional[str] = None

# TMDB API Functions
async def search_tmdb_movies(query: str, page: int = 1):
    """Search movies on TMDB"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={
                "api_key": TMDB_API_KEY,
                "query": query,
                "page": page
            }
        )
        return response.json()

async def search_tmdb_tv_shows(query: str, page: int = 1):
    """Search TV shows on TMDB"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/tv",
            params={
                "api_key": TMDB_API_KEY,
                "query": query,
                "page": page
            }
        )
        return response.json()

async def get_movie_details(tmdb_id: int):
    """Get detailed movie information from TMDB"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"api_key": TMDB_API_KEY}
        )
        return response.json()

async def get_tv_details(tmdb_id: int):
    """Get detailed TV show information from TMDB"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/tv/{tmdb_id}",
            params={"api_key": TMDB_API_KEY}
        )
        return response.json()

def process_movie_data(movie_data):
    """Process TMDB movie data into our format"""
    return {
        "tmdb_id": movie_data["id"],
        "title": movie_data["title"],
        "media_type": "movie",
        "year": int(movie_data["release_date"][:4]) if movie_data.get("release_date") else None,
        "genres": [genre["name"] for genre in movie_data.get("genres", [])],
        "poster_path": f"{TMDB_IMAGE_BASE_URL}{movie_data['poster_path']}" if movie_data.get("poster_path") else None,
        "overview": movie_data.get("overview"),
        "backdrop_path": f"{TMDB_IMAGE_BASE_URL}{movie_data['backdrop_path']}" if movie_data.get("backdrop_path") else None,
        "vote_average": movie_data.get("vote_average"),
        "release_date": movie_data.get("release_date")
    }

def process_tv_data(tv_data):
    """Process TMDB TV show data into our format"""
    return {
        "tmdb_id": tv_data["id"],
        "title": tv_data.get("name", tv_data.get("original_name")),
        "media_type": "tv",
        "year": int(tv_data["first_air_date"][:4]) if tv_data.get("first_air_date") else None,
        "genres": [genre["name"] for genre in tv_data.get("genres", [])],
        "poster_path": f"{TMDB_IMAGE_BASE_URL}{tv_data['poster_path']}" if tv_data.get("poster_path") else None,
        "overview": tv_data.get("overview"),
        "backdrop_path": f"{TMDB_IMAGE_BASE_URL}{tv_data['backdrop_path']}" if tv_data.get("backdrop_path") else None,
        "vote_average": tv_data.get("vote_average"),
        "release_date": tv_data.get("first_air_date"),
        "seasons": tv_data.get("number_of_seasons"),
        "episodes": tv_data.get("number_of_episodes"),
        "last_episode_to_air": tv_data.get("last_episode_to_air"),
        "next_episode_to_air": tv_data.get("next_episode_to_air")
    }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Media Trakker API"}

@api_router.get("/search")
async def search_media(query: str = Query(...), media_type: str = Query(...), page: int = Query(1)):
    """Search for media items (movies or TV shows)"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    try:
        # First check our local database
        local_results = await db.media_items.find({
            "title": {"$regex": query, "$options": "i"},
            "media_type": media_type
        }).limit(10).to_list(10)
        
        # If we have local results, return them
        if local_results and len(local_results) >= 5:
            return {
                "results": [MediaItem(**item) for item in local_results],
                "source": "local"
            }
        
        # Otherwise, search TMDB
        if media_type == "movie":
            tmdb_results = await search_tmdb_movies(query, page)
        elif media_type == "tv":
            tmdb_results = await search_tmdb_tv_shows(query, page)
        else:
            raise HTTPException(status_code=400, detail="Media type must be 'movie' or 'tv'")
        
        # Process and cache the results
        processed_results = []
        for item in tmdb_results.get("results", []):
            # Check if we already have this item in our database
            existing_item = await db.media_items.find_one({
                "tmdb_id": item["id"],
                "media_type": media_type
            })
            
            if existing_item:
                processed_results.append(MediaItem(**existing_item))
            else:
                # Get detailed information and cache it
                if media_type == "movie":
                    detailed_data = await get_movie_details(item["id"])
                    processed_data = process_movie_data(detailed_data)
                else:
                    detailed_data = await get_tv_details(item["id"])
                    processed_data = process_tv_data(detailed_data)
                
                # Create MediaItem and save to database
                media_item = MediaItem(**processed_data)
                await db.media_items.insert_one(media_item.dict())
                processed_results.append(media_item)
        
        return {
            "results": processed_results,
            "source": "tmdb",
            "total_results": tmdb_results.get("total_results", 0),
            "total_pages": tmdb_results.get("total_pages", 1)
        }
    
    except Exception as e:
        logging.error(f"Error searching media: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while searching")

@api_router.get("/media/{media_id}")
async def get_media_item(media_id: str):
    """Get a specific media item by ID"""
    media_item = await db.media_items.find_one({"id": media_id})
    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found")
    return MediaItem(**media_item)

@api_router.post("/user-list")
async def add_to_user_list(item: UserListItemCreate):
    """Add a media item to user's list"""
    # For demo purposes, using a default user_id
    user_id = "demo_user"
    
    # Check if item already exists in user's list
    existing_item = await db.user_lists.find_one({
        "user_id": user_id,
        "media_id": item.media_id
    })
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Item already in your list")
    
    # Create new list item
    list_item = UserListItem(
        user_id=user_id,
        **item.dict()
    )
    
    await db.user_lists.insert_one(list_item.dict())
    return list_item

@api_router.get("/user-list")
async def get_user_list(status: Optional[str] = None, media_type: Optional[str] = None):
    """Get user's media list"""
    user_id = "demo_user"
    
    # Build query
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    if media_type:
        query["media_type"] = media_type
    
    # Get list items
    list_items = await db.user_lists.find(query).to_list(1000)
    
    # Enrich with media details
    enriched_items = []
    for item in list_items:
        media_item = await db.media_items.find_one({"id": item["media_id"]})
        if media_item:
            enriched_items.append({
                "list_item": UserListItem(**item),
                "media_item": MediaItem(**media_item)
            })
    
    return enriched_items

@api_router.put("/user-list/{list_item_id}")
async def update_user_list_item(list_item_id: str, update_data: UserListItemUpdate):
    """Update a user's list item"""
    user_id = "demo_user"
    
    # Find the list item
    list_item = await db.user_lists.find_one({
        "id": list_item_id,
        "user_id": user_id
    })
    
    if not list_item:
        raise HTTPException(status_code=404, detail="List item not found")
    
    # Update the item
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.user_lists.update_one(
        {"id": list_item_id, "user_id": user_id},
        {"$set": update_dict}
    )
    
    # Return updated item
    updated_item = await db.user_lists.find_one({
        "id": list_item_id,
        "user_id": user_id
    })
    
    return UserListItem(**updated_item)

@api_router.delete("/user-list/{list_item_id}")
async def remove_from_user_list(list_item_id: str):
    """Remove a media item from user's list"""
    user_id = "demo_user"
    
    result = await db.user_lists.delete_one({
        "id": list_item_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="List item not found")
    
    return {"message": "Item removed from list"}

@api_router.get("/stats")
async def get_user_stats():
    """Get user's media consumption statistics"""
    user_id = "demo_user"
    
    # Get counts by status
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": {
                "status": "$status",
                "media_type": "$media_type"
            },
            "count": {"$sum": 1}
        }}
    ]
    
    stats_data = await db.user_lists.aggregate(pipeline).to_list(1000)
    
    # Format stats
    stats = {}
    for item in stats_data:
        media_type = item["_id"]["media_type"]
        status = item["_id"]["status"]
        count = item["count"]
        
        if media_type not in stats:
            stats[media_type] = {}
        stats[media_type][status] = count
    
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()