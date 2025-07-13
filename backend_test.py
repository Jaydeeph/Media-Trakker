import requests
import unittest
import json
import sys
from datetime import datetime

class MediaTrakkerAPITest(unittest.TestCase):
    def setUp(self):
        # Use the public endpoint from frontend/.env
        self.base_url = "https://6550351b-9c50-49d8-9504-731308e5e7d9.preview.emergentagent.com/api"
        self.test_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.test_items = []  # Store created items for cleanup

    def test_01_api_root(self):
        """Test the API root endpoint"""
        print("\n🔍 Testing API root endpoint...")
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Media Trakker API"})
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

    def test_04_add_to_user_list(self):
        """Test adding items to user list"""
        print("\n🔍 Testing adding items to user list...")
        
        # First search for a movie to add
        movie_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Inception", "media_type": "movie"}
        )
        movie_data = movie_response.json()
        movie_id = movie_data["results"][0]["id"]
        
        # Add movie to list with 'watching' status
        add_response = requests.post(
            f"{self.base_url}/user-list",
            json={
                "media_id": movie_id,
                "media_type": "movie",
                "status": "watching"
            }
        )
        
        # Check if item was added successfully or already exists
        if add_response.status_code == 400 and "already in your list" in add_response.json().get("detail", ""):
            print("⚠️ Movie already in list (this is okay)")
        else:
            self.assertEqual(add_response.status_code, 200, f"Failed to add movie: {add_response.text}")
            list_item_id = add_response.json().get("id")
            self.test_items.append(list_item_id)
            print(f"✅ Added movie to list with ID: {list_item_id}")
        
        # Now search for a TV show to add
        tv_response = requests.get(
            f"{self.base_url}/search",
            params={"query": "Stranger Things", "media_type": "tv"}
        )
        tv_data = tv_response.json()
        tv_id = tv_data["results"][0]["id"]
        
        # Add TV show to list with 'planning' status
        add_tv_response = requests.post(
            f"{self.base_url}/user-list",
            json={
                "media_id": tv_id,
                "media_type": "tv",
                "status": "planning"
            }
        )
        
        # Check if item was added successfully or already exists
        if add_tv_response.status_code == 400 and "already in your list" in add_tv_response.json().get("detail", ""):
            print("⚠️ TV show already in list (this is okay)")
        else:
            self.assertEqual(add_tv_response.status_code, 200, f"Failed to add TV show: {add_tv_response.text}")
            tv_list_item_id = add_tv_response.json().get("id")
            self.test_items.append(tv_list_item_id)
            print(f"✅ Added TV show to list with ID: {tv_list_item_id}")

    def test_05_get_user_list(self):
        """Test retrieving user list"""
        print("\n🔍 Testing retrieving user list...")
        
        # Get all items
        response = requests.get(f"{self.base_url}/user-list")
        self.assertEqual(response.status_code, 200)
        items = response.json()
        self.assertIsInstance(items, list)
        print(f"✅ Retrieved {len(items)} items from user list")
        
        # Test filtering by status
        status_response = requests.get(
            f"{self.base_url}/user-list",
            params={"status": "watching"}
        )
        self.assertEqual(status_response.status_code, 200)
        watching_items = status_response.json()
        print(f"✅ Retrieved {len(watching_items)} items with 'watching' status")
        
        # Test filtering by media type
        type_response = requests.get(
            f"{self.base_url}/user-list",
            params={"media_type": "movie"}
        )
        self.assertEqual(type_response.status_code, 200)
        movie_items = type_response.json()
        print(f"✅ Retrieved {len(movie_items)} movie items")
        
        # Return the first item ID if available for update test
        if items:
            return items[0]["list_item"]["id"]
        return None

    def test_06_update_list_item(self):
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
            json={"status": new_status}
        )
        
        self.assertEqual(update_response.status_code, 200)
        updated_item = update_response.json()
        self.assertEqual(updated_item["status"], new_status)
        print(f"✅ Updated item status from '{current_status}' to '{new_status}'")

    def test_07_remove_from_list(self):
        """Test removing an item from the list"""
        print("\n🔍 Testing removing item from list...")
        
        # Get user list to find an item to remove
        list_response = requests.get(f"{self.base_url}/user-list")
        items = list_response.json()
        
        if not items:
            print("⚠️ No items in list to remove, skipping test")
            return
        
        # Get the last item's ID to remove
        item_id = items[-1]["list_item"]["id"]
        
        # Remove the item
        remove_response = requests.delete(f"{self.base_url}/user-list/{item_id}")
        
        self.assertEqual(remove_response.status_code, 200)
        self.assertEqual(remove_response.json(), {"message": "Item removed from list"})
        print(f"✅ Successfully removed item with ID: {item_id}")

    def test_08_get_stats(self):
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
    test_suite.addTest(MediaTrakkerAPITest('test_04_add_to_user_list'))
    test_suite.addTest(MediaTrakkerAPITest('test_05_get_user_list'))
    test_suite.addTest(MediaTrakkerAPITest('test_06_update_list_item'))
    test_suite.addTest(MediaTrakkerAPITest('test_07_remove_from_list'))
    test_suite.addTest(MediaTrakkerAPITest('test_08_get_stats'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    print("=" * 80)
    print("MEDIA TRAKKER API TEST SUITE")
    print("=" * 80)
    
    success = run_tests()
    sys.exit(0 if success else 1)