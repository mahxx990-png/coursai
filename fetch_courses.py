import os
import json
import time
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import isodate

# --- CONFIGURATION ---
# Get API key from environment variable
API_KEY = os.environ.get("YOUTUBE_API_KEY")
OUTPUT_FILE = "courses_dataset.json"

# We aim for ~20 courses per topic, so we'll fetch up to 15 single videos and 15 playlists per topic
# (Some will be filtered out due to duration/duplicates)
MAX_RESULTS_PER_TYPE = 15 

# YouTube Data API Daily Quota is typically 10,000 units.
# We stop at 9,500 to be safe and avoid hard errors.
DAILY_QUOTA_LIMIT = 9500 

TOPICS = [
    "Python programming", "JavaScript", "HTML CSS", "SQL databases", "React JS",
    "Data Structures and Algorithms", "Machine Learning", "Excel", "Digital Marketing",
    "Graphic Design", "UI UX Design", "Public Speaking", "Photography", "Video Editing",
    "Project Management", "Cybersecurity Basics", "Cloud Computing AWS", "Git and GitHub",
    "Node.js", "Flutter",
    
    # New diverse topics
    "Business Administration", "Accounting Basics", "Psychology", "World History", 
    "Physics", "Chemistry", "Biology", "English Grammar", "Spanish for Beginners", 
    "Creative Writing", "Fitness and Workout", "Nutrition", "Yoga for Beginners", 
    "Music Theory", "Piano Lessons", "Guitar Lessons", "Cooking Basics", 
    "Baking", "Interior Design", "Fashion Design", "Personal Finance", 
    "Investing and Stock Market", "Real Estate Investing", "Law Basics", 
    "Sociology", "Philosophy", "Art History", "Drawing for Beginners", 
    "Animation Basics", "3D Modeling Blender", "Architecture Basics", 
    "Mechanical Engineering", "Calculus", "Statistics and Probability", 
    "Leadership Skills", "Sales Training", "Human Resources Management", 
    "Supply Chain Management", "First Aid", "Digital Art", "Copywriting",
    "Political Science", "Geography", "Astronomy Basics", "Nursing Basics",
    "Pharmacology", "Dentistry Basics", "Physical Therapy", "Veterinary Basics",
    "Agriculture Basics", "Electrical Engineering", "Civil Engineering"
]

# --- STATE ---
quota_used = 0
seen_video_ids = set()
seen_course_ids = set()
topic_course_counts = {}

# --- INITIALIZATION ---
if API_KEY:
    youtube = build("youtube", "v3", developerKey=API_KEY)
else:
    print("WARNING: YOUTUBE_API_KEY environment variable not set.")
    youtube = None


def get_video_duration(duration_iso):
    """Convert ISO 8601 duration (e.g., PT1H30M15S) to seconds."""
    try:
        return int(isodate.parse_duration(duration_iso).total_seconds())
    except:
        return 0

def add_quota(cost):
    """Track API quota usage and check if we are near the limit."""
    global quota_used
    quota_used += cost
    if quota_used >= DAILY_QUOTA_LIMIT:
        print(f"*** Reached quota limit safety threshold ({quota_used}/{DAILY_QUOTA_LIMIT}). Stopping API calls. ***")
        return False
    return True

def fetch_channel_stats(channel_ids):
    """Fetch subscriber counts for a list of channels."""
    if not channel_ids:
        return {}
    
    # 1 unit for channels.list
    if not add_quota(1): return {}
    
    try:
        response = youtube.channels().list(
            part="statistics",
            id=",".join(channel_ids)
        ).execute()
        
        stats = {}
        for item in response.get("items", []):
            stats[item["id"]] = int(item["statistics"].get("subscriberCount", 0))
        return stats
    except Exception as e:
        print(f"Error fetching channel stats: {e}")
        return {}

def fetch_video_details(video_ids):
    """Fetch duration and stats for a list of videos (max 50 at a time)."""
    if not video_ids:
        return {}
        
    # 1 unit for videos.list
    if not add_quota(1): return {}
    
    try:
        response = youtube.videos().list(
            part="contentDetails,statistics",
            id=",".join(video_ids)
        ).execute()
        
        details = {}
        for item in response.get("items", []):
            duration_secs = get_video_duration(item["contentDetails"]["duration"])
            details[item["id"]] = {
                "duration_seconds": duration_secs,
                "view_count": int(item["statistics"].get("viewCount", 0))
            }
        return details
    except Exception as e:
        print(f"Error fetching video details: {e}")
        return {}

def fetch_playlist_items(playlist_id):
    """Fetch all videos in a playlist."""
    videos = []
    page_token = None
    order_index = 1
    
    while True:
        # 1 unit per page of playlist items
        if not add_quota(1): break
        
        try:
            response = youtube.playlistItems().list(
                part="snippet",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=page_token
            ).execute()
            
            video_ids = []
            for item in response.get("items", []):
                vid = item["snippet"]["resourceId"]["videoId"]
                video_ids.append(vid)
            
            # Fetch durations for these videos
            details = fetch_video_details(video_ids)
            
            for item in response.get("items", []):
                vid = item["snippet"]["resourceId"]["videoId"]
                
                # Skip duplicate videos globally
                if vid in seen_video_ids:
                    continue
                    
                vid_details = details.get(vid, {})
                duration = vid_details.get("duration_seconds", 0)
                
                # Skip videos under 3 minutes (180s)
                if duration < 180:
                    continue
                    
                seen_video_ids.add(vid)
                videos.append({
                    "video_id": vid,
                    "title": item["snippet"]["title"],
                    "order_index": order_index,
                    "duration_seconds": duration
                })
                order_index += 1
                
            page_token = response.get("nextPageToken")
            if not page_token:
                break
        except Exception as e:
            print(f"Error fetching playlist items for {playlist_id}: {e}")
            break
            
    return videos

def search_courses(topic):
    """Search for single video courses and playlist courses for a given topic."""
    courses = []
    
    # --- 1. Search for Single Videos ---
    # Cost: 100 units for search
    if not add_quota(100): return courses
    
    try:
        print(f"    Searching for single video courses...")
        video_search = youtube.search().list(
            part="snippet",
            q=f"{topic} full course",
            type="video",
            videoDuration="long", # > 20 mins natively supported by API for videos
            maxResults=MAX_RESULTS_PER_TYPE,
            order="relevance"
        ).execute()
        
        video_items = video_search.get("items", [])
        video_ids = [item["id"]["videoId"] for item in video_items]
        
        # Collect unique channel IDs to fetch subscriber stats
        channels = {item["id"]["videoId"]: item["snippet"]["channelId"] for item in video_items}
        
        # Batch fetch details and channel stats
        v_details = fetch_video_details(video_ids)
        c_stats = fetch_channel_stats(list(set(channels.values())))
        
        for item in video_items:
            vid = item["id"]["videoId"]
            if vid in seen_course_ids: continue
            
            dur = v_details.get(vid, {}).get("duration_seconds", 0)
            
            # Ensure strictly > 20 mins (1200 seconds)
            if dur < 1200: 
                continue
                
            seen_course_ids.add(vid)
            seen_video_ids.add(vid)
            
            courses.append({
                "course_id": vid,
                "title": item["snippet"]["title"],
                "instructor": item["snippet"]["channelTitle"],
                "topic": topic,
                "type": "single_video",
                "source_url": f"https://www.youtube.com/watch?v={vid}",
                "channel_subscribers": c_stats.get(channels[vid], 0),
                "videos": [
                    {
                        "video_id": vid,
                        "title": item["snippet"]["title"],
                        "order_index": 1,
                        "duration_seconds": dur
                    }
                ]
            })
    except Exception as e:
        print(f"Error searching single videos for {topic}: {e}")

    # --- 2. Search for Playlists ---
    # Cost: 100 units for search
    if not add_quota(100): return courses
    
    try:
        print(f"    Searching for playlist courses...")
        playlist_search = youtube.search().list(
            part="snippet",
            q=f"{topic} tutorial",
            type="playlist",
            maxResults=MAX_RESULTS_PER_TYPE,
            order="relevance"
        ).execute()
        
        playlist_items = playlist_search.get("items", [])
        channel_ids = [item["snippet"]["channelId"] for item in playlist_items]
        c_stats = fetch_channel_stats(channel_ids)
        
        for item in playlist_items:
            pid = item["id"]["playlistId"]
            if pid in seen_course_ids: continue
            
            # Fetch videos in this playlist
            videos = fetch_playlist_items(pid)
            
            if not videos:
                continue # Skip empty playlists
                
            seen_course_ids.add(pid)
            courses.append({
                "course_id": pid,
                "title": item["snippet"]["title"],
                "instructor": item["snippet"]["channelTitle"],
                "topic": topic,
                "type": "playlist",
                "source_url": f"https://www.youtube.com/playlist?list={pid}",
                "channel_subscribers": c_stats.get(item["snippet"]["channelId"], 0),
                "videos": videos
            })
    except Exception as e:
        print(f"Error searching playlists for {topic}: {e}")
        
    return courses

def save_incrementally(new_courses):
    """Append new courses to the JSON file safely."""
    if not new_courses:
        return
        
    dataset = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                dataset = json.load(f)
        except Exception:
            pass # File might be empty or corrupted, start fresh
            
    dataset.extend(new_courses)
    
    # Save the updated dataset
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

def main():
    if not youtube:
        return
        
    print("Starting course data collection...")
    
    # Load existing file to populate seen_ids and avoid duplicates/re-fetching
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for course in existing:
                    seen_course_ids.add(course["course_id"])
                    topic_course_counts[course["topic"]] = topic_course_counts.get(course["topic"], 0) + 1
                    for v in course["videos"]:
                        seen_video_ids.add(v["video_id"])
            print(f"Loaded {len(existing)} existing courses from {OUTPUT_FILE}")
        except Exception as e:
            print(f"Could not load existing dataset: {e}")

    total_new_courses = 0
    total_new_videos = 0

    for topic in TOPICS:
        if quota_used >= DAILY_QUOTA_LIMIT:
            print("Quota limit reached. Exiting topic loop.")
            break
            
        # Optional: Skip topic if we already collected enough courses for it in previous runs
        if topic_course_counts.get(topic, 0) >= 10:
            print(f"\nSkipping '{topic}', already have {topic_course_counts[topic]} courses.")
            continue
            
        print(f"\nProcessing topic: {topic}")
        new_courses = search_courses(topic)
        
        # Sort by channel subscribers (descending) to prefer higher quality/popular channels
        for c in new_courses:
            # We add subscriber count during fetch, but remove it or keep it? We keep it for sorting.
            pass
        new_courses.sort(key=lambda x: x.get("channel_subscribers", 0), reverse=True)
        
        # Optionally remove the subscriber count from output if not requested
        for c in new_courses:
            if "channel_subscribers" in c:
                del c["channel_subscribers"]
        
        save_incrementally(new_courses)
        
        topic_videos = sum(len(c["videos"]) for c in new_courses)
        total_new_courses += len(new_courses)
        total_new_videos += topic_videos
        
        print(f"  -> Found {len(new_courses)} courses, {topic_videos} videos.")
        print(f"  -> Quota used so far: {quota_used}/{DAILY_QUOTA_LIMIT}")
        
        # Tiny sleep to be polite to the API rate limits (though quota is the real bottleneck)
        time.sleep(1)

    print("\n" + "="*40)
    print("COLLECTION COMPLETE")
    print(f"Total new courses collected: {total_new_courses}")
    print(f"Total new videos collected: {total_new_videos}")
    print(f"Final quota used: {quota_used}")
    print("="*40)

if __name__ == "__main__":
    main()
