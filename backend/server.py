from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.orm import Session
from database import get_db, create_tables, UserList, UserPreferences
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (for external API caching)
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
mongo_db = mongo_client[os.environ['DB_NAME']]

# Create PostgreSQL tables
create_tables()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# TMDB Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
ANILIST_API_URL = "https://graphql.anilist.co"
GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

# Pydantic Models
class MediaItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tmdb_id: int
    title: str
    media_type: str  # 'movie', 'tv', 'anime', 'manga', 'book'
    year: Optional[int] = None
    genres: List[str] = []
    poster_path: Optional[str] = None
    overview: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    release_date: Optional[str] = None
    # Media-specific fields
    seasons: Optional[int] = None
    episodes: Optional[int] = None
    chapters: Optional[int] = None
    volumes: Optional[int] = None
    authors: Optional[List[str]] = []
    publisher: Optional[str] = None
    page_count: Optional[int] = None
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

class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications_enabled: Optional[bool] = None

# External API Functions (same as before)
async def search_tmdb_movies(query: str, page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={"api_key": TMDB_API_KEY, "query": query, "page": page}
        )
        return response.json()

async def search_tmdb_tv_shows(query: str, page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/tv",
            params={"api_key": TMDB_API_KEY, "query": query, "page": page}
        )
        return response.json()

async def get_movie_details(tmdb_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"api_key": TMDB_API_KEY}
        )
        return response.json()

async def get_tv_details(tmdb_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/tv/{tmdb_id}",
            params={"api_key": TMDB_API_KEY}
        )
        return response.json()

async def search_anilist(query: str, media_type: str, page: int = 1):
    graphql_query = """
    query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(search: $search, type: $type) {
                id
                title { romaji english native }
                format status episodes chapters volumes genres averageScore
                startDate { year month day }
                endDate { year month day }
                coverImage { large medium }
                bannerImage description
                studios { nodes { name } }
            }
        }
    }
    """
    
    variables = {
        "search": query,
        "type": media_type.upper(),
        "page": page,
        "perPage": 10
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            ANILIST_API_URL,
            json={"query": graphql_query, "variables": variables}
        )
        return response.json()

async def search_google_books(query: str, page: int = 1):
    start_index = (page - 1) * 10
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                GOOGLE_BOOKS_API_URL,
                params={"q": query, "startIndex": start_index, "maxResults": 10}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"items": []}
        except Exception as e:
            logging.error(f"Google Books API error: {str(e)}")
            return {"items": []}

def process_movie_data(movie_data):
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
        "episodes": tv_data.get("number_of_episodes")
    }

def process_anilist_data(anilist_data, media_type):
    if not anilist_data.get("data") or not anilist_data["data"].get("Page"):
        return []
    
    processed_items = []
    for item in anilist_data["data"]["Page"]["media"]:
        try:
            title = item["title"]["english"] or item["title"]["romaji"] or item["title"]["native"]
            start_date = item.get("startDate")
            year = start_date.get("year") if start_date else None
            
            processed_item = {
                "tmdb_id": item["id"],
                "title": title,
                "media_type": media_type.lower(),
                "year": year,
                "genres": item.get("genres", []),
                "poster_path": item.get("coverImage", {}).get("large"),
                "overview": item.get("description"),
                "vote_average": item.get("averageScore", 0) / 10 if item.get("averageScore") else None,
                "episodes": item.get("episodes"),
                "chapters": item.get("chapters"),
                "volumes": item.get("volumes")
            }
            processed_items.append(processed_item)
        except Exception as e:
            logging.error(f"Error processing AniList item: {str(e)}")
            continue
    
    return processed_items

def process_google_books_data(books_data):
    processed_items = []
    for item in books_data.get("items", []):
        volume_info = item.get("volumeInfo", {})
        image_links = volume_info.get("imageLinks", {})
        poster_path = image_links.get("thumbnail") or image_links.get("smallThumbnail")
        
        published_date = volume_info.get("publishedDate", "")
        year = None
        if published_date:
            try:
                year = int(published_date[:4])
            except (ValueError, IndexError):
                pass
        
        processed_item = {
            "tmdb_id": hash(item["id"]) % (10**8),  # Convert string ID to int
            "title": volume_info.get("title", ""),
            "media_type": "book",
            "year": year,
            "genres": volume_info.get("categories", []),
            "poster_path": poster_path,
            "overview": volume_info.get("description"),
            "vote_average": volume_info.get("averageRating"),
            "authors": volume_info.get("authors", []),
            "publisher": volume_info.get("publisher"),
            "page_count": volume_info.get("pageCount")
        }
        processed_items.append(processed_item)
    
    return processed_items

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Media Trakker API with PostgreSQL"}

@api_router.get("/search")
async def search_media(query: str = Query(...), media_type: str = Query(...), page: int = Query(1)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    valid_media_types = ["movie", "tv", "anime", "manga", "book"]
    if media_type not in valid_media_types:
        raise HTTPException(status_code=400, detail=f"Media type must be one of: {', '.join(valid_media_types)}")
    
    try:
        # Check MongoDB cache first
        local_results = await mongo_db.media_items.find({
            "title": {"$regex": query, "$options": "i"},
            "media_type": media_type
        }).limit(10).to_list(10)
        
        if local_results and len(local_results) >= 5:
            return {"results": [MediaItem(**item) for item in local_results], "source": "cache"}
        
        # Search external APIs
        processed_results = []
        
        if media_type == "movie":
            tmdb_results = await search_tmdb_movies(query, page)
            for item in tmdb_results.get("results", []):
                detailed_data = await get_movie_details(item["id"])
                processed_data = process_movie_data(detailed_data)
                media_item = MediaItem(**processed_data)
                await mongo_db.media_items.insert_one(media_item.dict())
                processed_results.append(media_item)
        
        elif media_type == "tv":
            tmdb_results = await search_tmdb_tv_shows(query, page)
            for item in tmdb_results.get("results", []):
                detailed_data = await get_tv_details(item["id"])
                processed_data = process_tv_data(detailed_data)
                media_item = MediaItem(**processed_data)
                await mongo_db.media_items.insert_one(media_item.dict())
                processed_results.append(media_item)
        
        elif media_type in ["anime", "manga"]:
            anilist_results = await search_anilist(query, media_type, page)
            processed_data_list = process_anilist_data(anilist_results, media_type)
            for processed_data in processed_data_list:
                media_item = MediaItem(**processed_data)
                await mongo_db.media_items.insert_one(media_item.dict())
                processed_results.append(media_item)
        
        elif media_type == "book":
            books_results = await search_google_books(query, page)
            processed_data_list = process_google_books_data(books_results)
            for processed_data in processed_data_list:
                media_item = MediaItem(**processed_data)
                await mongo_db.media_items.insert_one(media_item.dict())
                processed_results.append(media_item)
        
        return {"results": processed_results, "source": "external"}
    
    except Exception as e:
        logging.error(f"Error searching media: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while searching")

@api_router.post("/user-list")
async def add_to_user_list(item: UserListItemCreate, db: Session = Depends(get_db)):
    # Check if item already exists
    existing_item = db.query(UserList).filter(
        UserList.user_id == "demo_user",
        UserList.media_id == item.media_id
    ).first()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Item already in your list")
    
    # Create new list item
    db_item = UserList(
        user_id="demo_user",
        media_id=item.media_id,
        media_type=item.media_type,
        status=item.status,
        rating=item.rating,
        notes=item.notes,
        progress=json.dumps(item.progress) if item.progress else None
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return {"message": "Item added to list", "id": db_item.id}

@api_router.get("/user-list")
async def get_user_list(status: Optional[str] = None, media_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(UserList).filter(UserList.user_id == "demo_user")
    
    if status:
        query = query.filter(UserList.status == status)
    if media_type:
        query = query.filter(UserList.media_type == media_type)
    
    list_items = query.all()
    
    # Enrich with media details from MongoDB
    enriched_items = []
    for item in list_items:
        media_item = await mongo_db.media_items.find_one({"id": item.media_id})
        if media_item:
            enriched_items.append({
                "list_item": {
                    "id": item.id,
                    "user_id": item.user_id,
                    "media_id": item.media_id,
                    "media_type": item.media_type,
                    "status": item.status,
                    "rating": item.rating,
                    "notes": item.notes,
                    "progress": json.loads(item.progress) if item.progress else None,
                    "created_at": item.created_at.isoformat(),
                    "updated_at": item.updated_at.isoformat()
                },
                "media_item": MediaItem(**media_item)
            })
    
    return enriched_items

@api_router.put("/user-list/{list_item_id}")
async def update_user_list_item(list_item_id: str, update_data: UserListItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(UserList).filter(
        UserList.id == list_item_id,
        UserList.user_id == "demo_user"
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="List item not found")
    
    # Update fields
    if update_data.status is not None:
        db_item.status = update_data.status
    if update_data.rating is not None:
        db_item.rating = update_data.rating
    if update_data.notes is not None:
        db_item.notes = update_data.notes
    if update_data.progress is not None:
        db_item.progress = json.dumps(update_data.progress)
    
    db_item.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Item updated successfully"}

@api_router.delete("/user-list/{list_item_id}")
async def remove_from_user_list(list_item_id: str, db: Session = Depends(get_db)):
    result = db.query(UserList).filter(
        UserList.id == list_item_id,
        UserList.user_id == "demo_user"
    ).delete()
    
    if result == 0:
        raise HTTPException(status_code=404, detail="List item not found")
    
    db.commit()
    return {"message": "Item removed from list"}

@api_router.get("/stats")
async def get_user_stats(db: Session = Depends(get_db)):
    list_items = db.query(UserList).filter(UserList.user_id == "demo_user").all()
    
    stats = {}
    for item in list_items:
        media_type = item.media_type
        status = item.status
        
        if media_type not in stats:
            stats[media_type] = {}
        if status not in stats[media_type]:
            stats[media_type][status] = 0
        
        stats[media_type][status] += 1
    
    return stats

@api_router.get("/user-preferences")
async def get_user_preferences(db: Session = Depends(get_db)):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == "demo_user").first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreferences(user_id="demo_user", theme="light")
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return {
        "theme": preferences.theme,
        "language": preferences.language,
        "notifications_enabled": preferences.notifications_enabled
    }

@api_router.put("/user-preferences")
async def update_user_preferences(update_data: UserPreferencesUpdate, db: Session = Depends(get_db)):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == "demo_user").first()
    
    if not preferences:
        preferences = UserPreferences(user_id="demo_user")
        db.add(preferences)
    
    if update_data.theme is not None:
        preferences.theme = update_data.theme
    if update_data.language is not None:
        preferences.language = update_data.language
    if update_data.notifications_enabled is not None:
        preferences.notifications_enabled = update_data.notifications_enabled
    
    preferences.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Preferences updated successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()