import os
import sqlite3
import requests
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

DB_PATH = os.path.join(os.path.dirname(__file__), "coursai.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses';")
    if not cursor.fetchone():
        print("Database not initialized. Please run pipeline.py first to setup schema.")
        conn.close()
        return False
    conn.close()
    return True

def fetch_udemy_courses(query="python", page_size=10):
    """
    Fetches courses from Udemy Paid Courses For Free API.
    """
    print(f"\n[Udemy] Fetching '{query}' courses...")
    url = f"https://udemy-paid-courses-for-free-api.p.rapidapi.com/rapidapi/courses/search?page=1&page_size={page_size}&query={query}"
    
    headers = {
        "x-rapidapi-host": "udemy-paid-courses-for-free-api.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get('results', [])  # Adjust this if the API structure is different
    except Exception as e:
        print(f"[Udemy Error] Failed to fetch: {e}")
        return []

def fetch_coursera_courses():
    """
    Fetches courses from Collection For Coursera Courses API.
    """
    print(f"\n[Coursera] Fetching courses...")
    url = "https://collection-for-coursera-courses.p.rapidapi.com/rapidapi/course/getCourse.php"
    
    headers = {
        "x-rapidapi-host": "collection-for-coursera-courses.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        # Ensure we return a list. Assuming the API returns a list directly or a specific key.
        if isinstance(data, list):
            return data
        elif 'courses' in data:
            return data['courses']
        return []
    except Exception as e:
        print(f"[Coursera Error] Failed to fetch: {e}")
        return []

def import_courses():
    if not RAPIDAPI_KEY or RAPIDAPI_KEY == "your_rapidapi_key_here":
        print("ERROR: Please set your RAPIDAPI_KEY in the backend/.env file.")
        return

    if not init_db():
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Fetch and process Udemy courses
    udemy_courses = fetch_udemy_courses(query="python", page_size=5)
    for course in udemy_courses:
        # Note: Extracting fields based on common Udemy API structures. 
        # May need adjustment based on actual JSON response.
        title = course.get("title", "Unknown Udemy Course")
        c_id = f"udemy-{uuid.uuid4().hex[:8]}"
        slug = title.lower().replace(" ", "-")[:50]
        instructor = course.get("instructor_name", "Udemy Instructor")
        thumbnail = course.get("image_480x270", "")
        desc = course.get("headline", "Imported from Udemy")
        
        cursor.execute("""
            INSERT OR IGNORE INTO courses (id, title, slug, instructor_name, category, description, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (c_id, title, slug, instructor, "Programming", desc, thumbnail))
        print(f"  -> Inserted Udemy: {title}")

    # 2. Fetch and process Coursera courses
    coursera_courses = fetch_coursera_courses()
    for course in coursera_courses[:5]:  # Limit to 5 for now
        title = course.get("name", "Unknown Coursera Course")
        c_id = f"coursera-{course.get('id', uuid.uuid4().hex[:8])}"
        slug = course.get("slug", title.lower().replace(" ", "-")[:50])
        instructor = course.get("instructor_name", "Coursera Instructor") 
        thumbnail = course.get("photoUrl", "")
        desc = course.get("description", "Imported from Coursera")
        
        cursor.execute("""
            INSERT OR IGNORE INTO courses (id, title, slug, instructor_name, category, description, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (c_id, title, slug, instructor, "General", desc, thumbnail))
        print(f"  -> Inserted Coursera: {title}")

    conn.commit()
    conn.close()
    print("\nData import complete!")

if __name__ == "__main__":
    import_courses()
