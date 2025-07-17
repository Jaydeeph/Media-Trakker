from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, create_tables, UserList, UserPreferences, MediaItem, media_items_collection, user_lists_collection, user_preferences_collection
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create MongoDB collections (no-op for MongoDB)
create_tables()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# External API Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
ANILIST_API_URL = "https://graphql.anilist.co"
GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"
IGDB_CLIENT_ID = os.environ.get('IGDB_CLIENT_ID')
IGDB_CLIENT_SECRET = os.environ.get('IGDB_CLIENT_SECRET')
IGDB_BASE_URL = "https://api.igdb.com/v4"
TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token"

# Pydantic Models
class MediaItemResponse(BaseModel):
    id: str
    external_id: str
    title: str
    media_type: str
    year: Optional[int] = None
    genres: List[str] = []
    poster_path: Optional[str] = None
    overview: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    release_date: Optional[str] = None
    seasons: Optional[int] = None
    episodes: Optional[int] = None
    chapters: Optional[int] = None
    volumes: Optional[int] = None
    authors: Optional[List[str]] = []
    publisher: Optional[str] = None
    page_count: Optional[int] = None
    # Games-specific fields
    platforms: Optional[List[str]] = []
    developers: Optional[List[str]] = []
    publishers: Optional[List[str]] = []
    release_year: Optional[int] = None
    rating: Optional[float] = None
    game_modes: Optional[List[str]] = []

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

# External API Functions
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

# IGDB API Functions
async def get_igdb_access_token():
    """Get access token for IGDB API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                TWITCH_AUTH_URL,
                params={
                    "client_id": IGDB_CLIENT_ID,
                    "client_secret": IGDB_CLIENT_SECRET,
                    "grant_type": "client_credentials"
                }
            )
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                logging.error(f"IGDB Auth error: {response.status_code}")
                return None
        except Exception as e:
            logging.error(f"IGDB Auth error: {str(e)}")
            return None

async def search_igdb_games(query: str, page: int = 1):
    """Search games using IGDB API"""
    token = await get_igdb_access_token()
    if not token:
        return []
    
    offset = (page - 1) * 10
    
    # IGDB query to get games with all relevant fields
    igdb_query = f"""
    fields name, summary, cover.url, cover.image_id, platforms.name, 
           involved_companies.company.name, involved_companies.developer,
           involved_companies.publisher, first_release_date, rating, 
           game_modes.name, genres.name, release_dates.human, 
           release_dates.y, screenshots.image_id;
    search "{query}";
    limit 10;
    offset {offset};
    """
    
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Content-Type": "text/plain"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{IGDB_BASE_URL}/games",
                headers=headers,
                content=igdb_query
            )
            if response.status_code == 200:
                return response.json()
            else:
                logging.error(f"IGDB Games API error: {response.status_code}")
                return []
        except Exception as e:
            logging.error(f"IGDB Games API error: {str(e)}")
            return []

# Helper functions to create MediaItem objects and cache them in MongoDB
async def create_media_item_from_tmdb_movie(movie_data):
    media_data = {
        "_id": str(uuid.uuid4()),
        "external_id": str(movie_data["id"]),
        "title": movie_data["title"],
        "media_type": "movie",
        "year": int(movie_data["release_date"][:4]) if movie_data.get("release_date") else None,
        "genres": [genre["name"] for genre in movie_data.get("genres", [])],
        "poster_path": f"{TMDB_IMAGE_BASE_URL}{movie_data['poster_path']}" if movie_data.get("poster_path") else None,
        "overview": movie_data.get("overview"),
        "backdrop_path": f"{TMDB_IMAGE_BASE_URL}{movie_data['backdrop_path']}" if movie_data.get("backdrop_path") else None,
        "vote_average": movie_data.get("vote_average"),
        "release_date": movie_data.get("release_date"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Check if already exists
    existing = await media_items_collection.find_one({
        "external_id": media_data["external_id"],
        "media_type": "movie"
    })
    
    if existing:
        return existing
    
    await media_items_collection.insert_one(media_data)
    return media_data

async def create_media_item_from_tmdb_tv(tv_data):
    media_data = {
        "_id": str(uuid.uuid4()),
        "external_id": str(tv_data["id"]),
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
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    existing = await media_items_collection.find_one({
        "external_id": media_data["external_id"],
        "media_type": "tv"
    })
    
    if existing:
        return existing
    
    await media_items_collection.insert_one(media_data)
    return media_data

async def create_media_item_from_anilist(item_data, media_type):
    try:
        title = item_data["title"]["english"] or item_data["title"]["romaji"] or item_data["title"]["native"]
        start_date = item_data.get("startDate")
        year = start_date.get("year") if start_date else None
        
        media_data = {
            "_id": str(uuid.uuid4()),
            "external_id": str(item_data["id"]),
            "title": title,
            "media_type": media_type.lower(),
            "year": year,
            "genres": item_data.get("genres", []),
            "poster_path": item_data.get("coverImage", {}).get("large"),
            "overview": item_data.get("description"),
            "vote_average": item_data.get("averageScore", 0) / 10 if item_data.get("averageScore") else None,
            "episodes": item_data.get("episodes"),
            "chapters": item_data.get("chapters"),
            "volumes": item_data.get("volumes"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        existing = await media_items_collection.find_one({
            "external_id": media_data["external_id"],
            "media_type": media_type.lower()
        })
        
        if existing:
            return existing
        
        await media_items_collection.insert_one(media_data)
        return media_data
    except Exception as e:
        logging.error(f"Error creating AniList media item: {str(e)}")
        return None

async def create_media_item_from_book(book_data):
    try:
        volume_info = book_data.get("volumeInfo", {})
        image_links = volume_info.get("imageLinks", {})
        poster_path = image_links.get("thumbnail") or image_links.get("smallThumbnail")
        
        published_date = volume_info.get("publishedDate", "")
        year = None
        if published_date:
            try:
                year = int(published_date[:4])
            except (ValueError, IndexError):
                pass
        
        media_data = {
            "_id": str(uuid.uuid4()),
            "external_id": book_data["id"],
            "title": volume_info.get("title", ""),
            "media_type": "book",
            "year": year,
            "genres": volume_info.get("categories", []),
            "poster_path": poster_path,
            "overview": volume_info.get("description"),
            "vote_average": volume_info.get("averageRating"),
            "authors": volume_info.get("authors", []),
            "publisher": volume_info.get("publisher"),
            "page_count": volume_info.get("pageCount"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        existing = await media_items_collection.find_one({
            "external_id": media_data["external_id"],
            "media_type": "book"
        })
        
        if existing:
            return existing
        
        await media_items_collection.insert_one(media_data)
        return media_data
    except Exception as e:
        logging.error(f"Error creating book media item: {str(e)}")
        return None

async def create_media_item_from_igdb_game(game_data):
    try:
        # Extract basic info
        external_id = str(game_data["id"])
        title = game_data.get("name", "")
        overview = game_data.get("summary", "")
        rating = game_data.get("rating", 0) / 10 if game_data.get("rating") else None
        
        # Extract release year
        release_year = None
        if game_data.get("first_release_date"):
            from datetime import datetime
            release_year = datetime.fromtimestamp(game_data["first_release_date"]).year
        
        # Extract cover image
        poster_path = None
        if game_data.get("cover"):
            image_id = game_data["cover"].get("image_id")
            if image_id:
                poster_path = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"
        
        # Extract platforms
        platforms = []
        if game_data.get("platforms"):
            platforms = [platform.get("name", "") for platform in game_data["platforms"]]
        
        # Extract developers and publishers
        developers = []
        publishers = []
        if game_data.get("involved_companies"):
            for company in game_data["involved_companies"]:
                company_name = company.get("company", {}).get("name", "")
                if company.get("developer"):
                    developers.append(company_name)
                if company.get("publisher"):
                    publishers.append(company_name)
        
        # Extract genres
        genres = []
        if game_data.get("genres"):
            genres = [genre.get("name", "") for genre in game_data["genres"]]
        
        # Extract game modes
        game_modes = []
        if game_data.get("game_modes"):
            game_modes = [mode.get("name", "") for mode in game_data["game_modes"]]
        
        media_data = {
            "_id": str(uuid.uuid4()),
            "external_id": external_id,
            "title": title,
            "media_type": "game",
            "year": release_year,
            "genres": genres,
            "poster_path": poster_path,
            "overview": overview,
            "vote_average": rating,
            "platforms": platforms,
            "developers": developers,
            "publishers": publishers,
            "release_year": release_year,
            "rating": rating,
            "game_modes": game_modes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        existing = await media_items_collection.find_one({
            "external_id": media_data["external_id"],
            "media_type": "game"
        })
        
        if existing:
            return existing
        
        await media_items_collection.insert_one(media_data)
        return media_data
    except Exception as e:
        logging.error(f"Error creating game media item: {str(e)}")
        return None

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Media Trakker API - Full PostgreSQL"}

@api_router.get("/search")
async def search_media(query: str = Query(...), media_type: str = Query(...), page: int = Query(1)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    valid_media_types = ["movie", "tv", "anime", "manga", "book", "game"]
    if media_type not in valid_media_types:
        raise HTTPException(status_code=400, detail=f"Media type must be one of: {', '.join(valid_media_types)}")
    
    try:
        # Check MongoDB cache first
        cached_results = await media_items_collection.find({
            "title": {"$regex": query, "$options": "i"},
            "media_type": media_type
        }).limit(10).to_list(length=10)
        
        if cached_results and len(cached_results) >= 5:
            return {
                "results": [MediaItemResponse(
                    id=item["_id"],
                    external_id=item["external_id"],
                    title=item["title"],
                    media_type=item["media_type"],
                    year=item.get("year"),
                    genres=item.get("genres", []),
                    poster_path=item.get("poster_path"),
                    overview=item.get("overview"),
                    backdrop_path=item.get("backdrop_path"),
                    vote_average=item.get("vote_average"),
                    release_date=item.get("release_date"),
                    seasons=item.get("seasons"),
                    episodes=item.get("episodes"),
                    chapters=item.get("chapters"),
                    volumes=item.get("volumes"),
                    authors=item.get("authors", []),
                    publisher=item.get("publisher"),
                    page_count=item.get("page_count"),
                    platforms=item.get("platforms", []),
                    developers=item.get("developers", []),
                    publishers=item.get("publishers", []),
                    release_year=item.get("release_year"),
                    rating=item.get("rating"),
                    game_modes=item.get("game_modes", [])
                ) for item in cached_results],
                "source": "cache"
            }
        
        # Search external APIs and cache results
        results = []
        
        if media_type == "movie":
            tmdb_results = await search_tmdb_movies(query, page)
            for item in tmdb_results.get("results", []):
                detailed_data = await get_movie_details(item["id"])
                media_item = await create_media_item_from_tmdb_movie(detailed_data)
                if media_item:
                    results.append(MediaItemResponse(
                        id=media_item["_id"],
                        external_id=media_item["external_id"],
                        title=media_item["title"],
                        media_type=media_item["media_type"],
                        year=media_item.get("year"),
                        genres=media_item.get("genres", []),
                        poster_path=media_item.get("poster_path"),
                        overview=media_item.get("overview"),
                        vote_average=media_item.get("vote_average"),
                        release_date=media_item.get("release_date")
                    ))
        
        elif media_type == "tv":
            tmdb_results = await search_tmdb_tv_shows(query, page)
            for item in tmdb_results.get("results", []):
                detailed_data = await get_tv_details(item["id"])
                media_item = await create_media_item_from_tmdb_tv(detailed_data)
                if media_item:
                    results.append(MediaItemResponse(
                        id=media_item["_id"],
                        external_id=media_item["external_id"],
                        title=media_item["title"],
                        media_type=media_item["media_type"],
                        year=media_item.get("year"),
                        genres=media_item.get("genres", []),
                        poster_path=media_item.get("poster_path"),
                        overview=media_item.get("overview"),
                        vote_average=media_item.get("vote_average"),
                        seasons=media_item.get("seasons"),
                        episodes=media_item.get("episodes")
                    ))
        
        elif media_type in ["anime", "manga"]:
            anilist_results = await search_anilist(query, media_type, page)
            if anilist_results.get("data") and anilist_results["data"].get("Page"):
                for item in anilist_results["data"]["Page"]["media"]:
                    media_item = await create_media_item_from_anilist(item, media_type)
                    if media_item:
                        results.append(MediaItemResponse(
                            id=media_item["_id"],
                            external_id=media_item["external_id"],
                            title=media_item["title"],
                            media_type=media_item["media_type"],
                            year=media_item.get("year"),
                            genres=media_item.get("genres", []),
                            poster_path=media_item.get("poster_path"),
                            overview=media_item.get("overview"),
                            vote_average=media_item.get("vote_average"),
                            episodes=media_item.get("episodes"),
                            chapters=media_item.get("chapters"),
                            volumes=media_item.get("volumes")
                        ))
        
        elif media_type == "book":
            books_results = await search_google_books(query, page)
            for item in books_results.get("items", []):
                media_item = await create_media_item_from_book(item)
                if media_item:
                    results.append(MediaItemResponse(
                        id=media_item["_id"],
                        external_id=media_item["external_id"],
                        title=media_item["title"],
                        media_type=media_item["media_type"],
                        year=media_item.get("year"),
                        genres=media_item.get("genres", []),
                        poster_path=media_item.get("poster_path"),
                        overview=media_item.get("overview"),
                        vote_average=media_item.get("vote_average"),
                        authors=media_item.get("authors", []),
                        publisher=media_item.get("publisher"),
                        page_count=media_item.get("page_count")
                    ))
        
        elif media_type == "game":
            games_results = await search_igdb_games(query, page)
            for item in games_results:
                media_item = await create_media_item_from_igdb_game(item)
                if media_item:
                    results.append(MediaItemResponse(
                        id=media_item["_id"],
                        external_id=media_item["external_id"],
                        title=media_item["title"],
                        media_type=media_item["media_type"],
                        year=media_item.get("year"),
                        genres=media_item.get("genres", []),
                        poster_path=media_item.get("poster_path"),
                        overview=media_item.get("overview"),
                        vote_average=media_item.get("vote_average"),
                        platforms=media_item.get("platforms", []),
                        developers=media_item.get("developers", []),
                        publishers=media_item.get("publishers", []),
                        release_year=media_item.get("release_year"),
                        rating=media_item.get("rating"),
                        game_modes=media_item.get("game_modes", [])
                    ))
        
        return {"results": results, "source": "external"}
    
    except Exception as e:
        logging.error(f"Error searching media: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while searching")

@api_router.post("/user-list")
async def add_to_user_list(item: UserListItemCreate):
    # Check if item already exists
    existing_item = await user_lists_collection.find_one({
        "user_id": "demo_user",
        "media_id": item.media_id
    })
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Item already in your list")
    
    # Create new list item
    list_item_data = {
        "_id": str(uuid.uuid4()),
        "user_id": "demo_user",
        "media_id": item.media_id,
        "media_type": item.media_type,
        "status": item.status,
        "rating": item.rating,
        "notes": item.notes,
        "progress": item.progress,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await user_lists_collection.insert_one(list_item_data)
    
    return {"message": "Item added to list", "id": list_item_data["_id"]}

@api_router.get("/user-list")
async def get_user_list(status: Optional[str] = None, media_type: Optional[str] = None):
    query = {"user_id": "demo_user"}
    
    if status:
        query["status"] = status
    if media_type:
        query["media_type"] = media_type
    
    list_items = await user_lists_collection.find(query).to_list(length=None)
    
    # Enrich with media details from MongoDB
    enriched_items = []
    for item in list_items:
        media_item = await media_items_collection.find_one({"_id": item["media_id"]})
        if media_item:
            enriched_items.append({
                "list_item": {
                    "id": item["_id"],
                    "user_id": item["user_id"],
                    "media_id": item["media_id"],
                    "media_type": item["media_type"],
                    "status": item["status"],
                    "rating": item.get("rating"),
                    "notes": item.get("notes"),
                    "progress": item.get("progress"),
                    "created_at": item["created_at"].isoformat(),
                    "updated_at": item["updated_at"].isoformat()
                },
                "media_item": MediaItemResponse(
                    id=media_item["_id"],
                    external_id=media_item["external_id"],
                    title=media_item["title"],
                    media_type=media_item["media_type"],
                    year=media_item.get("year"),
                    genres=media_item.get("genres", []),
                    poster_path=media_item.get("poster_path"),
                    overview=media_item.get("overview"),
                    backdrop_path=media_item.get("backdrop_path"),
                    vote_average=media_item.get("vote_average"),
                    release_date=media_item.get("release_date"),
                    seasons=media_item.get("seasons"),
                    episodes=media_item.get("episodes"),
                    chapters=media_item.get("chapters"),
                    volumes=media_item.get("volumes"),
                    authors=media_item.get("authors", []),
                    publisher=media_item.get("publisher"),
                    page_count=media_item.get("page_count"),
                    platforms=media_item.get("platforms", []),
                    developers=media_item.get("developers", []),
                    publishers=media_item.get("publishers", []),
                    release_year=media_item.get("release_year"),
                    rating=media_item.get("rating"),
                    game_modes=media_item.get("game_modes", [])
                )
            })
    
    return enriched_items

@api_router.put("/user-list/{list_item_id}")
async def update_user_list_item(list_item_id: str, update_data: UserListItemUpdate):
    # Find the item
    existing_item = await user_lists_collection.find_one({
        "_id": list_item_id,
        "user_id": "demo_user"
    })
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="List item not found")
    
    # Update fields
    update_fields = {"updated_at": datetime.utcnow()}
    
    if update_data.status is not None:
        update_fields["status"] = update_data.status
    if update_data.rating is not None:
        update_fields["rating"] = update_data.rating
    if update_data.notes is not None:
        update_fields["notes"] = update_data.notes
    if update_data.progress is not None:
        update_fields["progress"] = update_data.progress
    
    await user_lists_collection.update_one(
        {"_id": list_item_id, "user_id": "demo_user"},
        {"$set": update_fields}
    )
    
    return {"message": "Item updated successfully"}

@api_router.delete("/user-list/{list_item_id}")
async def remove_from_user_list(list_item_id: str):
    result = await user_lists_collection.delete_one({
        "_id": list_item_id,
        "user_id": "demo_user"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="List item not found")
    
    return {"message": "Item removed from list"}

@api_router.get("/stats")
async def get_user_stats():
    list_items = await user_lists_collection.find({"user_id": "demo_user"}).to_list(length=None)
    
    stats = {}
    for item in list_items:
        media_type = item["media_type"]
        status = item["status"]
        
        if media_type not in stats:
            stats[media_type] = {}
        if status not in stats[media_type]:
            stats[media_type][status] = 0
        
        stats[media_type][status] += 1
    
    return stats

@api_router.get("/user-preferences")
async def get_user_preferences():
    preferences = await user_preferences_collection.find_one({"user_id": "demo_user"})
    
    if not preferences:
        # Create default preferences
        preferences = {
            "_id": str(uuid.uuid4()),
            "user_id": "demo_user",
            "theme": "dark",
            "language": "en",
            "notifications_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await user_preferences_collection.insert_one(preferences)
    
    return {
        "theme": preferences.get("theme", "dark"),
        "language": preferences.get("language", "en"),
        "notifications_enabled": preferences.get("notifications_enabled", True)
    }

@api_router.put("/user-preferences")
async def update_user_preferences(update_data: UserPreferencesUpdate):
    preferences = await user_preferences_collection.find_one({"user_id": "demo_user"})
    
    if not preferences:
        preferences = {
            "_id": str(uuid.uuid4()),
            "user_id": "demo_user",
            "theme": "dark",
            "language": "en",
            "notifications_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await user_preferences_collection.insert_one(preferences)
    
    # Update fields
    update_fields = {"updated_at": datetime.utcnow()}
    
    if update_data.theme is not None:
        update_fields["theme"] = update_data.theme
    if update_data.language is not None:
        update_fields["language"] = update_data.language
    if update_data.notifications_enabled is not None:
        update_fields["notifications_enabled"] = update_data.notifications_enabled
    
    await user_preferences_collection.update_one(
        {"user_id": "demo_user"},
        {"$set": update_fields}
    )
    
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