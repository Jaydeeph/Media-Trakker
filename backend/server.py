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

# AniList Configuration
ANILIST_API_URL = "https://graphql.anilist.co"

# Google Books Configuration
GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

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
    # Anime/Manga specific fields
    chapters: Optional[int] = None
    volumes: Optional[int] = None
    status: Optional[str] = None  # FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED
    start_date: Optional[Dict] = None
    end_date: Optional[Dict] = None
    # Books specific fields
    authors: Optional[List[str]] = []
    publisher: Optional[str] = None
    page_count: Optional[int] = None
    isbn: Optional[str] = None
    published_date: Optional[str] = None
    # Games specific fields
    platforms: Optional[List[str]] = []
    developers: Optional[List[str]] = []
    publishers: Optional[List[str]] = []
    rating: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserListItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    media_id: str
    media_type: str  # 'movie', 'tv', 'anime', 'manga', 'book', 'game'
    status: str  # 'watching/reading/playing', 'completed', 'paused', 'planning', 'dropped'
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

# AniList API Functions
async def search_anilist(query: str, media_type: str, page: int = 1):
    """Search anime or manga on AniList"""
    graphql_query = """
    query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(search: $search, type: $type) {
                id
                title {
                    romaji
                    english
                    native
                }
                format
                status
                episodes
                chapters
                volumes
                genres
                averageScore
                popularity
                startDate {
                    year
                    month
                    day
                }
                endDate {
                    year
                    month
                    day
                }
                coverImage {
                    large
                    medium
                }
                bannerImage
                description
                studios {
                    nodes {
                        name
                    }
                }
                staff {
                    nodes {
                        name {
                            full
                        }
                    }
                }
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

async def get_anilist_details(anilist_id: int, media_type: str):
    """Get detailed information from AniList"""
    graphql_query = """
    query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
            id
            title {
                romaji
                english
                native
            }
            format
            status
            episodes
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate {
                year
                month
                day
            }
            endDate {
                year
                month
                day
            }
            coverImage {
                large
                medium
            }
            bannerImage
            description
            studios {
                nodes {
                    name
                }
            }
            staff {
                nodes {
                    name {
                        full
                    }
                }
            }
        }
    }
    """
    
    variables = {
        "id": anilist_id,
        "type": media_type.upper()
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            ANILIST_API_URL,
            json={"query": graphql_query, "variables": variables}
        )
        return response.json()

def process_anilist_data(anilist_data, media_type):
    """Process AniList data into our format"""
    media = anilist_data["data"]["Page"]["media"] if "Page" in anilist_data["data"] else [anilist_data["data"]["Media"]]
    
    processed_items = []
    for item in media:
        # Get the best available title
        title = item["title"]["english"] or item["title"]["romaji"] or item["title"]["native"]
        
        # Format start date
        start_date = item.get("startDate")
        year = start_date.get("year") if start_date else None
        
        # Format release date safely
        release_date = None
        if start_date and year:
            month = start_date.get("month", 1)
            day = start_date.get("day", 1)
            release_date = f"{year}-{month:02d}-{day:02d}"
        
        # Format studios/authors
        studios = [studio["name"] for studio in item.get("studios", {}).get("nodes", [])]
        
        processed_item = {
            "tmdb_id": item["id"],  # Using AniList ID but keeping field name for consistency
            "title": title,
            "media_type": media_type.lower(),
            "year": year,
            "genres": item.get("genres", []),
            "poster_path": item.get("coverImage", {}).get("large"),
            "overview": item.get("description"),
            "backdrop_path": item.get("bannerImage"),
            "vote_average": item.get("averageScore", 0) / 10 if item.get("averageScore") else None,
            "release_date": release_date,
            "status": item.get("status"),
            "episodes": item.get("episodes"),
            "chapters": item.get("chapters"),
            "volumes": item.get("volumes"),
            "start_date": start_date,
            "end_date": item.get("endDate"),
            "developers": studios if media_type == "anime" else [],
            "authors": studios if media_type == "manga" else []
        }
        
        processed_items.append(processed_item)
    
    return processed_items

# Google Books API Functions
async def search_google_books(query: str, page: int = 1):
    """Search books on Google Books API"""
    start_index = (page - 1) * 10
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_BOOKS_API_URL,
            params={
                "q": query,
                "startIndex": start_index,
                "maxResults": 10
            }
        )
        return response.json()

def process_google_books_data(books_data):
    """Process Google Books data into our format"""
    processed_items = []
    
    for item in books_data.get("items", []):
        volume_info = item.get("volumeInfo", {})
        
        # Get thumbnail image
        image_links = volume_info.get("imageLinks", {})
        poster_path = image_links.get("thumbnail") or image_links.get("smallThumbnail")
        
        # Get publication year
        published_date = volume_info.get("publishedDate", "")
        year = None
        if published_date:
            try:
                year = int(published_date[:4])
            except (ValueError, IndexError):
                pass
        
        processed_item = {
            "tmdb_id": item["id"],  # Using Google Books ID
            "title": volume_info.get("title", ""),
            "media_type": "book",
            "year": year,
            "genres": volume_info.get("categories", []),
            "poster_path": poster_path,
            "overview": volume_info.get("description"),
            "backdrop_path": None,
            "vote_average": volume_info.get("averageRating"),
            "release_date": published_date,
            "authors": volume_info.get("authors", []),
            "publisher": volume_info.get("publisher"),
            "page_count": volume_info.get("pageCount"),
            "isbn": volume_info.get("industryIdentifiers", [{}])[0].get("identifier") if volume_info.get("industryIdentifiers") else None,
            "published_date": published_date
        }
        
        processed_items.append(processed_item)
    
    return processed_items

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Media Trakker API"}

@api_router.get("/search")
async def search_media(query: str = Query(...), media_type: str = Query(...), page: int = Query(1)):
    """Search for media items (movies, TV shows, anime, manga, books)"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    valid_media_types = ["movie", "tv", "anime", "manga", "book"]
    if media_type not in valid_media_types:
        raise HTTPException(status_code=400, detail=f"Media type must be one of: {', '.join(valid_media_types)}")
    
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
        
        # Otherwise, search external APIs
        processed_results = []
        
        if media_type == "movie":
            tmdb_results = await search_tmdb_movies(query, page)
            for item in tmdb_results.get("results", []):
                existing_item = await db.media_items.find_one({
                    "tmdb_id": item["id"],
                    "media_type": media_type
                })
                
                if existing_item:
                    processed_results.append(MediaItem(**existing_item))
                else:
                    detailed_data = await get_movie_details(item["id"])
                    processed_data = process_movie_data(detailed_data)
                    media_item = MediaItem(**processed_data)
                    await db.media_items.insert_one(media_item.dict())
                    processed_results.append(media_item)
        
        elif media_type == "tv":
            tmdb_results = await search_tmdb_tv_shows(query, page)
            for item in tmdb_results.get("results", []):
                existing_item = await db.media_items.find_one({
                    "tmdb_id": item["id"],
                    "media_type": media_type
                })
                
                if existing_item:
                    processed_results.append(MediaItem(**existing_item))
                else:
                    detailed_data = await get_tv_details(item["id"])
                    processed_data = process_tv_data(detailed_data)
                    media_item = MediaItem(**processed_data)
                    await db.media_items.insert_one(media_item.dict())
                    processed_results.append(media_item)
        
        elif media_type in ["anime", "manga"]:
            anilist_results = await search_anilist(query, media_type, page)
            if anilist_results.get("data") and anilist_results["data"].get("Page"):
                processed_data_list = process_anilist_data(anilist_results, media_type)
                
                for processed_data in processed_data_list:
                    existing_item = await db.media_items.find_one({
                        "tmdb_id": processed_data["tmdb_id"],
                        "media_type": media_type
                    })
                    
                    if existing_item:
                        processed_results.append(MediaItem(**existing_item))
                    else:
                        media_item = MediaItem(**processed_data)
                        await db.media_items.insert_one(media_item.dict())
                        processed_results.append(media_item)
        
        elif media_type == "book":
            books_results = await search_google_books(query, page)
            processed_data_list = process_google_books_data(books_results)
            
            for processed_data in processed_data_list:
                existing_item = await db.media_items.find_one({
                    "tmdb_id": processed_data["tmdb_id"],
                    "media_type": media_type
                })
                
                if existing_item:
                    processed_results.append(MediaItem(**existing_item))
                else:
                    media_item = MediaItem(**processed_data)
                    await db.media_items.insert_one(media_item.dict())
                    processed_results.append(media_item)
        
        return {
            "results": processed_results,
            "source": "external",
            "total_results": len(processed_results)
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