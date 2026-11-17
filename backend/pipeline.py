import os
import re
import json
import sqlite3
import requests
import scrapetube
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

# =============================================================================
# CONFIGURATION & SETTINGS
# =============================================================================
DB_PATH = os.path.join(os.path.dirname(__file__), "coursai.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "schema.sql")

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gpt-oss:120b-cloud")

# Optional limit for testing (Set to None for unlimited videos per playlist)
MAX_VIDEOS_PER_COURSE = 5

DATASET_FILE = os.path.join(os.path.dirname(__file__), "courses_dataset_100.json")

if os.path.exists(DATASET_FILE):
    with open(DATASET_FILE, "r", encoding="utf-8") as f:
        COURSES = json.load(f)
else:
    COURSES = [
        {
            "course_id": "python-basics-corey",
            "title": "Python Programming Fundamentals",
            "instructor": "Corey Schafer",
            "category": "Computer Science",
            "platform": "YouTube",
            "playlist_url": "https://www.youtube.com/playlist?list=PL-osiE80TeTskrapNbzXhwoFUiLCjGgY7"
        },
        {
            "course_id": "html-elzero",
            "title": "HTML5 Web Mastery",
            "instructor": "Elzero Web School",
            "category": "Web Development",
            "platform": "YouTube",
            "playlist_url": "https://www.youtube.com/playlist?list=PLDoPjvoZm5OqMel7N7hLw4d2J7Uq7"
        }
    ]

# =============================================================================
# DATABASE INITIALIZATION
# =============================================================================
def init_database():
    """Ensures SQLite database exists and initializes schema if tables do not exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if courses table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses';")
    if not cursor.fetchone():
        print("[DB] Initializing database tables from schema.sql...")
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            cursor.executescript(schema_sql)
        else:
            # Inline fallback schema
            cursor.executescript("""
                CREATE TABLE IF NOT EXISTS courses (
                    id VARCHAR(64) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    instructor_name VARCHAR(128) NOT NULL,
                    category VARCHAR(64) NOT NULL,
                    description TEXT,
                    thumbnail_url VARCHAR(512),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS videos (
                    id VARCHAR(64) PRIMARY KEY,
                    course_id VARCHAR(64) NOT NULL,
                    youtube_video_id VARCHAR(32) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    duration_seconds INT NOT NULL DEFAULT 0,
                    sequence_order INT NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS video_transcripts (
                    id VARCHAR(64) PRIMARY KEY,
                    video_id VARCHAR(64) NOT NULL,
                    start_time_seconds FLOAT NOT NULL,
                    end_time_seconds FLOAT NOT NULL,
                    text_content TEXT NOT NULL,
                    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS quizzes (
                    id VARCHAR(64) PRIMARY KEY,
                    video_id VARCHAR(64) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    passing_score_percent INT NOT NULL DEFAULT 70,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS quiz_questions (
                    id VARCHAR(64) PRIMARY KEY,
                    quiz_id VARCHAR(64) NOT NULL,
                    question_text TEXT NOT NULL,
                    explanation TEXT,
                    sequence_order INT NOT NULL DEFAULT 1,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS quiz_options (
                    id VARCHAR(64) PRIMARY KEY,
                    question_id VARCHAR(64) NOT NULL,
                    option_text TEXT NOT NULL,
                    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
                    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
                );
            """)
        conn.commit()
    conn.close()

# =============================================================================
# PLAYLIST FETCHING
# =============================================================================
def get_playlist_videos(playlist_url, limit=None):
    """
    Uses scrapetube to fetch all video metadata from a YouTube playlist URL.
    Returns a list of dicts: [{"video_id": "", "title": "", "order_index": N}]
    Preserves original playlist video order.
    """
    playlist_id = None
    if "list=" in playlist_url:
        playlist_id = playlist_url.split("list=")[1].split("&")[0]
    
    print(f"  [Scraper] Extracting playlist videos (ID: {playlist_id or playlist_url})...")
    
    try:
        if playlist_id:
            videos_gen = scrapetube.get_playlist(playlist_id=playlist_id)
        else:
            videos_gen = scrapetube.get_playlist(playlist_url=playlist_url)
    except Exception as e:
        print(f"  [Error] Failed to fetch playlist via scrapetube: {e}")
        return []

    videos_list = []
    for idx, video in enumerate(videos_gen, start=1):
        if limit and len(videos_list) >= limit:
            break
        
        video_id = video.get("videoId")
        if not video_id:
            continue
            
        title = ""
        if "title" in video:
            title_obj = video["title"]
            if isinstance(title_obj, dict):
                if "runs" in title_obj and title_obj["runs"]:
                    title = title_obj["runs"][0].get("text", "")
                elif "simpleText" in title_obj:
                    title = title_obj.get("simpleText", "")
            elif isinstance(title_obj, str):
                title = title_obj
                
        if not title:
            title = f"Lesson {idx} ({video_id})"
            
        videos_list.append({
            "video_id": video_id,
            "title": title,
            "order_index": idx
        })
        
    return videos_list

# =============================================================================
# TRANSCRIPT FETCHING
# =============================================================================
def fetch_transcript(video_id):
    """
    Fetches transcript chunks using youtube-transcript-api with language fallback.
    Returns list of dicts: [{'start': float, 'end': float, 'text': str}] or None if missing.
    """
    try:
        # Try fetching preferred languages: English, Arabic, or auto-generated
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'ar', 'en-US', 'ar-SA'])
        result = []
        for item in transcript_list:
            start = float(item.get("start", 0.0))
            duration = float(item.get("duration", 0.0))
            text = item.get("text", "").strip()
            if text:
                result.append({
                    "start": round(start, 2),
                    "end": round(start + duration, 2),
                    "text": text
                })
        return result
    except (TranscriptsDisabled, NoTranscriptFound):
        print(f"    [Transcript] Captions disabled/unavailable for video: {video_id}")
        return None
    except Exception as e:
        print(f"    [Transcript Error] Could not fetch transcript for {video_id}: {e}")
        return None

# =============================================================================
# OLLAMA QUIZ GENERATION
# =============================================================================
def generate_quiz_with_ollama(video_title, transcript_data):
    """
    Uses local Ollama gpt-oss:120b-cloud model to generate structured multiple-choice quiz questions.
    Returns a list of question dicts or empty list on failure.
    """
    if not transcript_data:
        return []
        
    # Combine transcript text into manageable summary context (first 100 lines)
    text_summary = " ".join([t["text"] for t in transcript_data[:100]])
    if len(text_summary) > 4000:
        text_summary = text_summary[:4000]

    prompt = f"""You are an expert educational assessment creator. Based strictly on the following transcript segment for the lesson '{video_title}', generate 2 multiple-choice quiz questions.

TRANSCRIPT EXTRACT:
{text_summary}

Respond ONLY with a valid JSON array of objects, with NO additional text or markdown formatting. Format:
[
  {{
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Clear explanation of why option A is correct based on transcript."
  }}
]"""

    try:
        url = f"{OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {"temperature": 0.2}
        }
        res = requests.post(url, json=payload, timeout=30)
        if res.status_code == 200:
            content = res.json().get("message", {}).get("content", "")
            # Extract JSON from potential code fences
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
    except Exception as e:
        print(f"    [Ollama Note] Local Ollama not available or timed out ({e}). Generating fallback rule-based questions.")
    
    # Safe Fallback Quiz Questions if Ollama offline/busy
    return [
        {
            "question": f"What is the primary topic covered in the lesson '{video_title}'?",
            "options": [
                f"Core concepts of {video_title}",
                "Unrelated advanced frameworks",
                "Historical overview of computing",
                "Database design theory"
            ],
            "correct_index": 0,
            "explanation": f"The lesson focuses directly on practical fundamentals of {video_title}."
        }
    ]

# =============================================================================
# MAIN PIPELINE EXECUTION
# =============================================================================
def run_pipeline():
    init_database()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    total_courses = len(COURSES)
    total_videos_found = 0
    total_videos_succeeded = 0
    total_videos_failed = 0
    total_questions_generated = 0
    course_stats = []

    print("\n=========================================================")
    print("      COURSAI AUTOMATED DATASET & QUIZ PIPELINE          ")
    print("=========================================================\n")

    for course_idx, c_info in enumerate(COURSES, start=1):
        course_id = c_info["course_id"]
        title = c_info["title"]
        instructor = c_info["instructor"]
        category = c_info.get("category", "General")
        playlist_url = c_info["playlist_url"]
        slug = course_id.lower().replace(" ", "-")
        thumbnail = f"https://img.youtube.com/vi/{course_id}/maxresdefault.jpg"

        print(f"[{course_idx}/{total_courses}] Processing Course: '{title}' by {instructor}")

        # Save or update Course in SQL
        cursor.execute("""
            INSERT OR REPLACE INTO courses (id, title, slug, instructor_name, category, description, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (course_id, title, slug, instructor, category, f"Complete course track for {title}", thumbnail))
        conn.commit()

        # Step 1: Auto-fetch playlist video list
        playlist_videos = get_playlist_videos(playlist_url, limit=MAX_VIDEOS_PER_COURSE)
        num_found = len(playlist_videos)
        total_videos_found += num_found
        print(f"  -> Found {num_found} videos in playlist.")

        c_succeeded = 0
        c_failed = 0
        c_questions = 0

        # Step 2: Loop through videos
        for v in playlist_videos:
            yt_id = v["video_id"]
            v_title = v["title"]
            seq_order = v["order_index"]
            db_video_id = f"{course_id}-vid-{seq_order}"

            # Check resumability
            cursor.execute("SELECT id FROM videos WHERE id = ?", (db_video_id,))
            if cursor.fetchone():
                print(f"  [Skip] Video {seq_order} ({yt_id}) already exists in database.")
                c_succeeded += 1
                continue

            print(f"  Processing Video {seq_order}: '{v_title}' ({yt_id})...")

            # Step 3: Fetch Transcript
            transcript_data = fetch_transcript(yt_id)
            if not transcript_data:
                print(f"  [Failed] Skipping video {yt_id} due to missing captions.")
                c_failed += 1
                total_videos_failed += 1
                continue

            # Save Video
            cursor.execute("""
                INSERT OR REPLACE INTO videos (id, course_id, youtube_video_id, title, sequence_order)
                VALUES (?, ?, ?, ?, ?)
            """, (db_video_id, course_id, yt_id, v_title, seq_order))

            # Save Transcripts
            for t_idx, chunk in enumerate(transcript_data):
                t_id = f"{db_video_id}-t-{t_idx}"
                cursor.execute("""
                    INSERT OR REPLACE INTO video_transcripts (id, video_id, start_time_seconds, end_time_seconds, text_content)
                    VALUES (?, ?, ?, ?, ?)
                """, (t_id, db_video_id, chunk["start"], chunk["end"], chunk["text"]))

            # Step 4: Generate Quiz Questions via Ollama
            questions = generate_quiz_with_ollama(v_title, transcript_data)
            if questions:
                quiz_id = f"quiz-{db_video_id}"
                cursor.execute("""
                    INSERT OR REPLACE INTO quizzes (id, video_id, title, passing_score_percent)
                    VALUES (?, ?, ?, 70)
                """, (quiz_id, db_video_id, f"{v_title} Quiz"))

                for q_idx, q in enumerate(questions, start=1):
                    q_id = f"{quiz_id}-q{q_idx}"
                    cursor.execute("""
                        INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, explanation, sequence_order)
                        VALUES (?, ?, ?, ?, ?)
                    """, (q_id, quiz_id, q["question"], q.get("explanation", ""), q_idx))

                    for opt_idx, opt_text in enumerate(q.get("options", [])):
                        opt_id = f"{q_id}-opt{opt_idx}"
                        is_correct = (opt_idx == q.get("correct_index", 0))
                        cursor.execute("""
                            INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct)
                            VALUES (?, ?, ?, ?)
                        """, (opt_id, q_id, opt_text, is_correct))
                    
                    c_questions += 1
                    total_questions_generated += 1

            conn.commit()
            c_succeeded += 1
            total_videos_succeeded += 1
            print(f"    [Success] Video {yt_id} processed cleanly (+{len(questions)} questions).")

        course_stats.append({
            "course": title,
            "found": num_found,
            "succeeded": c_succeeded,
            "failed": c_failed,
            "questions": c_questions
        })
        print("")

    conn.close()

    # Step 5: Final Summary Output
    print("=========================================================")
    print("                    SUMMARY REPORT                       ")
    print("=========================================================")
    print(f"Total Courses Processed: {total_courses}")
    print(f"Total Videos Found:      {total_videos_found}")
    print(f"Successfully Imported:   {total_videos_succeeded}")
    print(f"Failed / Captions Off:   {total_videos_failed}")
    print(f"Total Questions Built:   {total_questions_generated}")
    print("---------------------------------------------------------")
    for stat in course_stats:
        print(f" • {stat['course']}: {stat['succeeded']}/{stat['found']} videos loaded, {stat['questions']} questions generated.")
    print("=========================================================\n")

if __name__ == "__main__":
    run_pipeline()
