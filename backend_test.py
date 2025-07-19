import requests
import unittest
import json
import sys
from datetime import datetime

class MediaTrakkerAPITest(unittest.TestCase):
    def setUp(self):
        # Use the public endpoint from frontend/.env
        self.base_url = "https://4457eb96-6a6f-4363-b562-e5bd7d82f717.preview.emergentagent.com/api"
        self.test_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.test_items = []  # Store created items for cleanup

    def test_01_api_root(self):
        """Test the API root endpoint"""
        print("\n🔍 Testing API root endpoint...")
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        print("✅ API root endpoint test passed")

    def test_02_search_movies(self):
        """Test searching for movies"""
        print("\n🔍 Testing movie search...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Avengers", "media_type": "movie"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No movie results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "movie")
        
        print(f"✅ Found {len(data['results'])} movies for 'Avengers'")
        return first_result["id"]  # Return ID for later use

    def test_03_search_tv_shows(self):
        """Test searching for TV shows"""
        print("\n🔍 Testing TV show search...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Breaking Bad", "media_type": "tv"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No TV show results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "tv")
        
        print(f"✅ Found {len(data['results'])} TV shows for 'Breaking Bad'")
        return first_result["id"]  # Return ID for later use

    def test_04_search_games(self):
        """Test searching for games using IGDB API"""
        print("\n🔍 Testing games search with IGDB API...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Mario", "media_type": "game"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No game results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "game")
        
        # Verify game-specific fields
        self.assertIn("platforms", first_result)
        self.assertIn("developers", first_result)
        self.assertIn("publishers", first_result)
        self.assertIn("game_modes", first_result)
        
        print(f"✅ Found {len(data['results'])} games for 'Mario'")
        print(f"  - First game: {first_result['title']}")
        print(f"  - Platforms: {first_result.get('platforms', [])}")
        print(f"  - Developers: {first_result.get('developers', [])}")
        print(f"  - Publishers: {first_result.get('publishers', [])}")
        print(f"  - Game modes: {first_result.get('game_modes', [])}")
        
        return first_result["id"]  # Return ID for later use

    def test_05_search_anime(self):
        """Test searching for anime"""
        print("\n🔍 Testing anime search...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Naruto", "media_type": "anime"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No anime results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "anime")
        
        print(f"✅ Found {len(data['results'])} anime for 'Naruto'")
        return first_result["id"]

    def test_06_search_manga(self):
        """Test searching for manga"""
        print("\n🔍 Testing manga search...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "One Piece", "media_type": "manga"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No manga results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "manga")
        
        print(f"✅ Found {len(data['results'])} manga for 'One Piece'")
        return first_result["id"]

    def test_07_search_books(self):
        """Test searching for books"""
        print("\n🔍 Testing book search...")
        response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Harry Potter", "media_type": "book"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertTrue(len(data["results"]) > 0, "No book results found")
        
        # Verify the structure of the first result
        first_result = data["results"][0]
        self.assertIn("id", first_result)
        self.assertIn("title", first_result)
        self.assertIn("media_type", first_result)
        self.assertEqual(first_result["media_type"], "book")
        
        # Verify book-specific fields
        self.assertIn("authors", first_result)
        self.assertIn("publisher", first_result)
        
        print(f"✅ Found {len(data['results'])} books for 'Harry Potter'")
        print(f"  - First book: {first_result['title']}")
        print(f"  - Authors: {first_result.get('authors', [])}")
        print(f"  - Publisher: {first_result.get('publisher', 'N/A')}")
        
        return first_result["id"]

    def test_08_add_to_user_list(self):
        """Test adding items to user list including games"""
        print("\n🔍 Testing adding items to user list...")
        
        # Test adding a movie
        movie_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Inception", "media_type": "movie"}
        )
        movie_data = movie_response.json()
        movie_id = movie_data["results"][0]["id"]
        
        add_response = requests.post(
            f"{self.base_url}/user-list",
            json={
                "media_id": movie_id,
                "media_type": "movie",
                "status": "watching"
            }
        )
        
        if add_response.status_code == 400 and "already in your list" in add_response.json().get("detail", ""):
            print("⚠️ Movie already in list (this is okay)")
        else:
            self.assertEqual(add_response.status_code, 200, f"Failed to add movie: {add_response.text}")
            list_item_id = add_response.json().get("id")
            self.test_items.append(list_item_id)
            print(f"✅ Added movie to list with ID: {list_item_id}")
        
        # Test adding a game
        game_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Zelda", "media_type": "game"}
        )
        game_data = game_response.json()
        if game_data["results"]:
            game_id = game_data["results"][0]["id"]
            
            add_game_response = requests.post(
                f"{self.base_url}/user-list",
                json={
                    "media_id": game_id,
                    "media_type": "game",
                    "status": "playing",
                    "progress": {"hours_played": 10}
                }
            )
            
            if add_game_response.status_code == 400 and "already in your list" in add_game_response.json().get("detail", ""):
                print("⚠️ Game already in list (this is okay)")
            else:
                self.assertEqual(add_game_response.status_code, 200, f"Failed to add game: {add_game_response.text}")
                game_list_item_id = add_game_response.json().get("id")
                self.test_items.append(game_list_item_id)
                print(f"✅ Added game to list with ID: {game_list_item_id}")
        
        # Test adding an anime
        anime_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Attack on Titan", "media_type": "anime"}
        )
        anime_data = anime_response.json()
        if anime_data["results"]:
            anime_id = anime_data["results"][0]["id"]
            
            add_anime_response = requests.post(
                f"{self.base_url}/user-list",
                json={
                    "media_id": anime_id,
                    "media_type": "anime",
                    "status": "completed",
                    "rating": 9.5
                }
            )
            
            if add_anime_response.status_code == 400 and "already in your list" in add_anime_response.json().get("detail", ""):
                print("⚠️ Anime already in list (this is okay)")
            else:
                self.assertEqual(add_anime_response.status_code, 200, f"Failed to add anime: {add_anime_response.text}")
                anime_list_item_id = add_anime_response.json().get("id")
                self.test_items.append(anime_list_item_id)
                print(f"✅ Added anime to list with ID: {anime_list_item_id}")

    def test_09_get_user_list_with_games(self):
        """Test retrieving user list including games"""
        print("\n🔍 Testing retrieving user list with games...")
        
        # Get all items
        response = requests.get(f"{self.base_url}/user-list")
        self.assertEqual(response.status_code, 200)
        items = response.json()
        self.assertIsInstance(items, list)
        print(f"✅ Retrieved {len(items)} items from user list")
        
        # Check for games in the list
        game_items = [item for item in items if item["media_item"]["media_type"] == "game"]
        if game_items:
            print(f"✅ Found {len(game_items)} games in user list")
            first_game = game_items[0]
            print(f"  - Game: {first_game['media_item']['title']}")
            print(f"  - Platforms: {first_game['media_item'].get('platforms', [])}")
            print(f"  - Developers: {first_game['media_item'].get('developers', [])}")
            print(f"  - Status: {first_game['list_item']['status']}")
        
        # Test filtering by game media type
        game_response = requests.get(
            f"{self.base_url}/user-list",
            params={"media_type": "game"}
        )
        self.assertEqual(game_response.status_code, 200)
        game_list_items = game_response.json()
        print(f"✅ Retrieved {len(game_list_items)} game items specifically")
        
        # Return the first item ID if available for update test
        if items:
            return items[0]["list_item"]["id"]
        return None

    def test_10_update_list_item(self):
        """Test updating a list item's status"""
        print("\n🔍 Testing updating list item status...")
        
        # Get user list to find an item to update
        list_response = requests.get(f"{self.base_url}/user-list")
        items = list_response.json()
        
        if not items:
            print("⚠️ No items in list to update, skipping test")
            return
        
        # Get the first item's ID
        item_id = items[0]["list_item"]["id"]
        current_status = items[0]["list_item"]["status"]
        
        # Choose a new status different from the current one
        statuses = ["watching", "completed", "paused", "planning", "dropped"]
        new_status = next((s for s in statuses if s != current_status), "completed")
        
        # Update the item
        update_response = requests.put(
            f"{self.base_url}/user-list/{item_id}",
            json={"status": new_status, "rating": 8.5}
        )
        
        self.assertEqual(update_response.status_code, 200)
        print(f"✅ Updated item status from '{current_status}' to '{new_status}'")

    def test_11_user_preferences(self):
        """Test user preferences endpoints"""
        print("\n🔍 Testing user preferences...")
        
        # Get current preferences
        get_response = requests.get(f"{self.base_url}/user-preferences")
        self.assertEqual(get_response.status_code, 200)
        preferences = get_response.json()
        
        # Verify structure
        self.assertIn("theme", preferences)
        self.assertIn("language", preferences)
        self.assertIn("notifications_enabled", preferences)
        
        print(f"✅ Retrieved user preferences:")
        print(f"  - Theme: {preferences['theme']}")
        print(f"  - Language: {preferences['language']}")
        print(f"  - Notifications: {preferences['notifications_enabled']}")
        
        # Update preferences
        new_theme = "light" if preferences["theme"] == "dark" else "dark"
        update_response = requests.put(
            f"{self.base_url}/user-preferences",
            json={
                "theme": new_theme,
                "notifications_enabled": not preferences["notifications_enabled"]
            }
        )
        
        self.assertEqual(update_response.status_code, 200)
        print(f"✅ Updated preferences - Theme: {new_theme}")

    def test_12_get_stats(self):
        """Test retrieving user statistics"""
        print("\n🔍 Testing statistics endpoint...")
        
        response = requests.get(f"{self.base_url}/stats")
        self.assertEqual(response.status_code, 200)
        stats = response.json()
        
        # Verify stats structure
        self.assertIsInstance(stats, dict)
        
        # Print stats summary
        print("✅ Retrieved user statistics:")
        for media_type, status_counts in stats.items():
            print(f"  - {media_type}: {sum(status_counts.values())} items")
            for status, count in status_counts.items():
                print(f"    • {status}: {count}")

    def test_13_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n🔍 Testing error handling...")
        
        # Test invalid media type
        invalid_type_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "test", "media_type": "invalid"}
        )
        self.assertEqual(invalid_type_response.status_code, 400)
        print("✅ Invalid media type properly rejected")
        
        # Test empty query
        empty_query_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "", "media_type": "movie"}
        )
        self.assertEqual(empty_query_response.status_code, 400)
        print("✅ Empty query properly rejected")
        
        # Test invalid list item ID
        invalid_id_response = requests.put(
            f"{self.base_url}/user-list/invalid-id",
            json={"status": "completed"}
        )
        self.assertEqual(invalid_id_response.status_code, 404)
        print("✅ Invalid list item ID properly rejected")

    def tearDown(self):
        """Clean up any test data if needed"""
        # We're not removing test items to preserve the database state for UI testing
        pass

def run_tests():
    """Run the test suite"""
    test_suite = unittest.TestSuite()
    test_suite.addTest(MediaTrakkerAPITest('test_01_api_root'))
    test_suite.addTest(MediaTrakkerAPITest('test_02_search_movies'))
    test_suite.addTest(MediaTrakkerAPITest('test_03_search_tv_shows'))
    test_suite.addTest(MediaTrakkerAPITest('test_04_search_games'))
    test_suite.addTest(MediaTrakkerAPITest('test_05_search_anime'))
    test_suite.addTest(MediaTrakkerAPITest('test_06_search_manga'))
    test_suite.addTest(MediaTrakkerAPITest('test_07_search_books'))
    test_suite.addTest(MediaTrakkerAPITest('test_08_add_to_user_list'))
    test_suite.addTest(MediaTrakkerAPITest('test_09_get_user_list_with_games'))
    test_suite.addTest(MediaTrakkerAPITest('test_10_update_list_item'))
    test_suite.addTest(MediaTrakkerAPITest('test_11_user_preferences'))
    test_suite.addTest(MediaTrakkerAPITest('test_12_get_stats'))
    test_suite.addTest(MediaTrakkerAPITest('test_13_error_handling'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    print("=" * 80)
    print("MEDIA TRAKKER API TEST SUITE")
    print("=" * 80)
    
    success = run_tests()
    sys.exit(0 if success else 1)