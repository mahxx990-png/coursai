import json
import os
import time
import requests
import sqlite3
import hashlib
import re
import uuid
from flask import Flask, request, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), "coursai.db")
ADMIN_DATA_FILE = os.path.join(os.path.dirname(__file__), "admin_custom_content.json")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 email TEXT UNIQUE,
                 password TEXT,
                 name TEXT
                 )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS courses (
                 id VARCHAR(64) PRIMARY KEY,
                 title VARCHAR(255) NOT NULL,
                 slug VARCHAR(255) UNIQUE NOT NULL,
                 instructor_name VARCHAR(128) NOT NULL,
                 category VARCHAR(64) NOT NULL,
                 description TEXT,
                 thumbnail_url VARCHAR(512),
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                 )''')

    c.execute('''CREATE TABLE IF NOT EXISTS videos (
                 id VARCHAR(64) PRIMARY KEY,
                 course_id VARCHAR(64) NOT NULL,
                 youtube_video_id VARCHAR(32) NOT NULL,
                 title VARCHAR(255) NOT NULL,
                 description TEXT,
                 duration_seconds INT NOT NULL DEFAULT 0,
                 sequence_order INT NOT NULL DEFAULT 1,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                 )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quizzes (
                 id VARCHAR(64) PRIMARY KEY,
                 video_id VARCHAR(64) NOT NULL,
                 title VARCHAR(255) NOT NULL,
                 passing_score_percent INT NOT NULL DEFAULT 70,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 is_graded BOOLEAN DEFAULT 0,
                 course_id VARCHAR(64)
                 )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quiz_questions (
                 id VARCHAR(64) PRIMARY KEY,
                 quiz_id VARCHAR(64) NOT NULL,
                 question_text TEXT NOT NULL,
                 explanation TEXT,
                 sequence_order INT NOT NULL DEFAULT 1
                 )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quiz_options (
                 id VARCHAR(64) PRIMARY KEY,
                 question_id VARCHAR(64) NOT NULL,
                 option_text TEXT NOT NULL,
                 is_correct BOOLEAN NOT NULL DEFAULT FALSE
                 )''')
    
    # Create a default user if not exists
    c.execute("SELECT * FROM users WHERE email = 'student@coursai.com'")
    if not c.fetchone():
        hashed_pw = hashlib.sha256("password123".encode()).hexdigest()
        c.execute("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", 
                  ('student@coursai.com', hashed_pw, 'Student'))
        
    conn.commit()
    conn.close()

init_db()

def extract_youtube_id(url_or_id):
    if not url_or_id:
        return "k9TUPpGqYTo"
    url_or_id = str(url_or_id).strip()
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
    match = re.search(r'(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})', url_or_id)
    if match:
        return match.group(1)
    clean = re.sub(r'[^a-zA-Z0-9_-]', '', url_or_id)
    return clean[:11] if len(clean) >= 11 else "k9TUPpGqYTo"

def save_course_to_db(course_obj):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO courses (id, title, slug, instructor_name, category, description, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            course_obj["id"],
            course_obj["title"],
            course_obj["id"],
            course_obj["instructor"],
            course_obj["category"],
            course_obj.get("description", ""),
            course_obj.get("thumbnail", "")
        ))
        for idx, vid in enumerate(course_obj.get("videos", [])):
            c.execute("""
                INSERT OR REPLACE INTO videos (id, course_id, youtube_video_id, title, description, duration_seconds, sequence_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                vid["id"],
                course_obj["id"],
                vid.get("youtube_video_id", vid["id"]),
                vid["title"],
                "",
                900,
                idx + 1
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving course to DB: {e}")

def delete_course_from_db(course_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        c.execute("DELETE FROM videos WHERE course_id = ?", (course_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error deleting course from DB: {e}")

def save_quiz_to_db(quiz_obj, course_id, video_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO quizzes (id, video_id, title, passing_score_percent, is_graded, course_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            quiz_obj["id"],
            video_id,
            quiz_obj["title"],
            quiz_obj.get("passing_score_percent", 70),
            1 if quiz_obj.get("is_graded") else 0,
            course_id
        ))
        
        c.execute("SELECT id FROM quiz_questions WHERE quiz_id = ?", (quiz_obj["id"],))
        old_q_ids = [row[0] for row in c.fetchall()]
        for oqid in old_q_ids:
            c.execute("DELETE FROM quiz_options WHERE question_id = ?", (oqid,))
        c.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", (quiz_obj["id"],))
        
        for idx, q in enumerate(quiz_obj.get("questions", [])):
            q_id = q.get("id") or f"q-{quiz_obj['id']}-{idx+1}"
            c.execute("""
                INSERT INTO quiz_questions (id, quiz_id, question_text, explanation, sequence_order)
                VALUES (?, ?, ?, ?, ?)
            """, (q_id, quiz_obj["id"], q.get("question", ""), q.get("explanation", ""), idx + 1))
            
            correct_idx = q.get("correct_index", 0)
            for opt_idx, opt_text in enumerate(q.get("options", [])):
                opt_id = f"opt-{q_id}-{opt_idx+1}"
                is_correct = 1 if opt_idx == correct_idx else 0
                c.execute("""
                    INSERT INTO quiz_options (id, question_id, option_text, is_correct)
                    VALUES (?, ?, ?, ?)
                """, (opt_id, q_id, opt_text, is_correct))
                
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving quiz to DB: {e}")

def delete_quiz_from_db(quiz_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT id FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
        q_ids = [r[0] for r in c.fetchall()]
        for qid in q_ids:
            c.execute("DELETE FROM quiz_options WHERE question_id = ?", (qid,))
        c.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
        c.execute("DELETE FROM quizzes WHERE id = ?", (quiz_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error deleting quiz from DB: {e}")

def save_admin_custom_data():
    try:
        custom_courses = [c for c in COURSES_DATASET.values() if c.get("is_custom")]
        custom_quizzes = []
        for c_id, course in COURSES_DATASET.items():
            for vid in course.get("videos", []):
                for q in vid.get("quizzes", []):
                    if q.get("is_custom"):
                        custom_quizzes.append({
                            "course_id": c_id,
                            "video_id": vid["id"],
                            "quiz": q
                        })
        data = {
            "custom_courses": custom_courses,
            "custom_quizzes": custom_quizzes
        }
        with open(ADMIN_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving admin custom data: {e}")

def load_admin_custom_data():
    if os.path.exists(ADMIN_DATA_FILE):
        try:
            with open(ADMIN_DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for course in data.get("custom_courses", []):
                    COURSES_DATASET[course["id"]] = course
                for item in data.get("custom_quizzes", []):
                    c_id = item.get("course_id")
                    v_id = item.get("video_id")
                    q = item.get("quiz")
                    if c_id in COURSES_DATASET:
                        for vid in COURSES_DATASET[c_id].get("videos", []):
                            if vid["id"] == v_id or vid.get("youtube_video_id") == v_id:
                                if "quizzes" not in vid:
                                    vid["quizzes"] = []
                                if not any(eq["id"] == q["id"] for eq in vid["quizzes"]):
                                    vid["quizzes"].append(q)
            print("Loaded custom courses & quizzes from admin_custom_content.json.")
        except Exception as e:
            print(f"Error loading admin custom data: {e}")

    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT id, video_id, title, passing_score_percent, is_graded, course_id FROM quizzes")
        db_quizzes = c.fetchall()
        for q_row in db_quizzes:
            q_id, v_id, q_title, passing_score, is_graded, c_id = q_row
            c.execute("SELECT id, question_text, explanation FROM quiz_questions WHERE quiz_id = ? ORDER BY sequence_order", (q_id,))
            q_rows = c.fetchall()
            questions = []
            for quest in q_rows:
                quest_id, quest_text, explanation = quest
                c.execute("SELECT option_text, is_correct FROM quiz_options WHERE question_id = ?", (quest_id,))
                opt_rows = c.fetchall()
                options = [opt[0] for opt in opt_rows]
                correct_idx = 0
                for idx, opt in enumerate(opt_rows):
                    if opt[1] == 1 or opt[1] is True:
                        correct_idx = idx
                        break
                questions.append({
                    "id": quest_id,
                    "question": quest_text,
                    "options": options if options else ["Option 1", "Option 2"],
                    "correct_index": correct_idx,
                    "explanation": explanation or ""
                })
            
            quiz_obj = {
                "id": q_id,
                "title": q_title,
                "video_id": v_id,
                "course_id": c_id,
                "is_graded": bool(is_graded),
                "passing_score_percent": passing_score or 70,
                "questions": questions,
                "is_custom": True
            }
            for course_id, course in COURSES_DATASET.items():
                for vid in course.get("videos", []):
                    if vid["id"] == v_id or vid.get("youtube_video_id") == v_id:
                        if "quizzes" not in vid:
                            vid["quizzes"] = []
                        if not any(eq["id"] == q_id for eq in vid["quizzes"]):
                            vid["quizzes"].append(quiz_obj)
        conn.close()
    except Exception as e:
        print(f"Error loading quizzes from SQLite: {e}")


# Ollama local configuration
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gpt-oss:120b-cloud")

# Core Dataset (Corey Schafer & Elzero Web School as specified in original requirements)
COURSES_DATASET = {
    "corey-python-basics": {
        "id": "corey-python-basics",
        "title": "Python Programming: Complete Beginner Fundamentals",
        "instructor": "Corey Schafer",
        "category": "Computer Science",
        "thumbnail": "https://img.youtube.com/vi/k9TUPpGqYTo/maxresdefault.jpg",
        "description": "Master core Python syntax, variables, data structures, strings, and object-oriented concepts with Corey Schafer.",
        "videos": [
            {
                "id": "python-setup-vars",
                "youtube_video_id": "k9TUPpGqYTo",
                "title": "Strings - Working with Textual Data",
                "duration": "19:42",
                "transcript": [
                    {"start": 0.0, "end": 45.0, "text": "Welcome to Python tutorial for beginners. In this video, we will learn how to work with strings and textual data in Python."},
                    {"start": 45.0, "end": 120.0, "text": "Strings in Python can be defined using single quotes or double quotes. For example, message = 'Hello World' creates a string variable named message."},
                    {"start": 120.0, "end": 210.0, "text": "If your string contains apostrophes, like 'Bobby's World', use double quotes to wrap the string or escape the single quote with a backslash."},
                    {"start": 210.0, "end": 350.0, "text": "To print formatted strings with variables, you can use f-strings in Python 3.6+. Example: f'{greeting}, {name}. Welcome!'"},
                    {"start": 350.0, "end": 500.0, "text": "Common string methods include message.lower(), message.upper(), message.count('Hello'), and message.find('World')."}
                ],
                "quizzes": [
                    {
                        "id": "q-py-1",
                        "title": "Python Strings Assessment",
                        "questions": [
                            {
                                "id": "q1",
                                "question": "Which Python syntax is recommended for string formatting in modern Python 3?",
                                "options": ["f-strings", "printf()", "StringConcat()", "%-formatting only"],
                                "correct_index": 0,
                                "explanation": "f-strings (Formatted string literals) introduced in Python 3.6+ are the cleanest and fastest way to format strings."
                            },
                            {
                                "id": "q2",
                                "question": "How do you count occurrences of a substring inside a string variable in Python?",
                                "options": ["str.length()", "str.count('sub')", "str.find_all()", "count_string()"],
                                "correct_index": 1,
                                "explanation": "The .count() method returns the total number of non-overlapping occurrences of a substring."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "elzero-html-mastery": {
        "id": "elzero-html-mastery",
        "title": "HTML5 & Web Fundamentals Course",
        "instructor": "Elzero Web School",
        "category": "Web Development",
        "thumbnail": "https://img.youtube.com/vi/6QAELgirvjs/maxresdefault.jpg",
        "description": "Learn modern HTML5 semantics, structural web layout elements, forms, and browser accessibility standards in Arabic.",
        "videos": [
            {
                "id": "elzero-html-intro",
                "youtube_video_id": "6QAELgirvjs",
                "title": "HTML Introduction & Semantic Elements",
                "duration": "14:10",
                "transcript": [
                    {"start": 0.0, "end": 60.0, "text": "Welcome to Elzero Web School HTML course. HTML stands for HyperText Markup Language and forms the structural backbone of every website."},
                    {"start": 60.0, "end": 180.0, "text": "Semantic HTML tags like <header>, <nav>, <main>, <article>, and <footer> give structural meaning to web browsers and search engines."},
                    {"start": 180.0, "end": 300.0, "text": "Always declare <!DOCTYPE html> at the very top of your HTML documents to enforce HTML5 standards mode in web browsers."},
                    {"start": 300.0, "end": 450.0, "text": "The <head> element contains document metadata like <title>, character encoding <meta charset='UTF-8'>, and CSS stylesheet links."}
                ],
                "quizzes": [
                    {
                        "id": "q-html-1",
                        "title": "HTML Foundations Assessment",
                        "questions": [
                            {
                                "id": "qh1",
                                "question": "What is the primary benefit of using Semantic HTML elements like <article> and <header>?",
                                "options": [
                                    "Provides structural meaning to browsers, search engines, and screen readers",
                                    "Automatically applies CSS styles without writing stylesheets",
                                    "Accelerates JavaScript execution speed",
                                    "Creates 3D models in the browser"
                                ],
                                "correct_index": 0,
                                "explanation": "Semantic tags describe the intent and meaning of content, significantly enhancing accessibility (a11y) and SEO."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "mosh-react": {
        "id": "mosh-react",
        "title": "React JS - React Tutorial for Beginners",
        "instructor": "Programming with Mosh",
        "category": "Web Development",
        "thumbnail": "https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg",
        "description": "Learn React JS from scratch in this beginner-friendly tutorial. We'll cover everything you need to know to build modern React apps.",
        "videos": [
            {
                "id": "react-mosh-1",
                "youtube_video_id": "Ke90Tje7VS0",
                "title": "React JS for Beginners",
                "duration": "2:25:27",
                "transcript": [
                    {"start": 0.0, "end": 60.0, "text": "React is a JavaScript library for building user interfaces. It was created by Facebook and is used by companies like Netflix, Airbnb, and Instagram."},
                    {"start": 60.0, "end": 180.0, "text": "At its core, React is all about components. A component is a piece of the UI. When you build applications with React, you build a bunch of independent, isolated, and reusable components and then compose them to build complex UIs."},
                    {"start": 180.0, "end": 300.0, "text": "Every React application has at least one component, which we refer to as the root component. This component represents the entire application and contains other child components."}
                ],
                "quizzes": [
                    {
                        "id": "q-react-1",
                        "title": "React Basics Quiz",
                        "questions": [
                            {
                                "id": "q1",
                                "question": "What is the core building block of a React application?",
                                "options": ["Modules", "Components", "Templates", "Directives"],
                                "correct_index": 1,
                                "explanation": "In React, applications are built using reusable and independent pieces of UI called components."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "freecodecamp-ml": {
        "id": "freecodecamp-ml",
        "title": "Machine Learning for Everybody",
        "instructor": "freeCodeCamp.org",
        "category": "Data Science",
        "thumbnail": "https://img.youtube.com/vi/i_LwzRmAUM9/maxresdefault.jpg",
        "description": "Learn Machine Learning in a way that is accessible to absolute beginners. You will learn the basics of Machine Learning and how to use it.",
        "videos": [
            {
                "id": "ml-fcc-1",
                "youtube_video_id": "i_LwzRmAUM9",
                "title": "Machine Learning for Everybody",
                "duration": "3:53:23",
                "transcript": [
                    {"start": 0.0, "end": 120.0, "text": "Welcome to this course on Machine Learning for Everybody. In this course, we're going to be talking about different machine learning algorithms and how they work."},
                    {"start": 120.0, "end": 240.0, "text": "Machine Learning is a subset of Artificial Intelligence that focuses on building systems that learn from data. It allows computers to learn without being explicitly programmed."},
                    {"start": 240.0, "end": 360.0, "text": "The main types of machine learning are supervised learning, unsupervised learning, and reinforcement learning."}
                ],
                "quizzes": [
                    {
                        "id": "q-ml-1",
                        "title": "Machine Learning Introduction",
                        "questions": [
                            {
                                "id": "q1",
                                "question": "Which of the following is NOT one of the main types of Machine Learning mentioned?",
                                "options": ["Supervised learning", "Reactive learning", "Unsupervised learning", "Reinforcement learning"],
                                "correct_index": 1,
                                "explanation": "Reactive learning is not one of the main types. The main types are supervised, unsupervised, and reinforcement learning."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "traversy-tailwind": {
        "id": "traversy-tailwind",
        "title": "Tailwind CSS Crash Course",
        "instructor": "Traversy Media",
        "category": "Web Development",
        "thumbnail": "https://img.youtube.com/vi/UBOj6rqRUME/maxresdefault.jpg",
        "description": "Learn how to use Tailwind CSS in this comprehensive crash course. We will build a complete landing page using Tailwind.",
        "videos": [
            {
                "id": "tw-tm-1",
                "youtube_video_id": "UBOj6rqRUME",
                "title": "Tailwind CSS Crash Course",
                "duration": "1:52:43",
                "transcript": [
                    {"start": 0.0, "end": 90.0, "text": "Hey guys, in this video we're going to look at Tailwind CSS, which is a utility-first CSS framework for rapidly building custom user interfaces."},
                    {"start": 90.0, "end": 200.0, "text": "Instead of writing custom CSS, you use utility classes like bg-blue-500, text-center, and p-4 right in your HTML markup."},
                    {"start": 200.0, "end": 300.0, "text": "This approach reduces the need to constantly switch between HTML and CSS files and helps maintain a consistent design system."}
                ],
                "quizzes": [
                    {
                        "id": "q-tw-1",
                        "title": "Tailwind CSS Concepts",
                        "questions": [
                            {
                                "id": "q1",
                                "question": "What kind of framework is Tailwind CSS primarily known as?",
                                "options": ["A component-based UI library", "A utility-first CSS framework", "A JavaScript layout engine", "A CSS-in-JS solution"],
                                "correct_index": 1,
                                "explanation": "Tailwind CSS is a utility-first CSS framework, meaning it provides low-level utility classes to build designs directly in HTML."
                            }
                        ]
                    }
                ]
            }
        ]
    }
}

# --- Dynamic Data Loading ---
def load_dynamic_courses():
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "courses_dataset.json")
    if not os.path.exists(dataset_path):
        print(f"Warning: Dataset file not found at {dataset_path}")
        return

    try:
        with open(dataset_path, "r", encoding="utf-8") as f:
            dataset = json.load(f)
            
        for course in dataset:
            # Generate thumbnail based on the first video
            thumbnail = ""
            if course.get("videos") and len(course["videos"]) > 0:
                first_video_id = course["videos"][0]["video_id"]
                thumbnail = f"https://img.youtube.com/vi/{first_video_id}/hqdefault.jpg"
            
            # Format videos
            formatted_videos = []
            for v in course.get("videos", []):
                dur_secs = v.get("duration_seconds", 0)
                if dur_secs >= 3600:
                    dur_str = f"{dur_secs // 3600}:{(dur_secs % 3600) // 60:02d}:{dur_secs % 60:02d}"
                else:
                    dur_str = f"{dur_secs // 60}:{dur_secs % 60:02d}"
                    
                formatted_videos.append({
                    "id": v["video_id"],
                    "youtube_video_id": v["video_id"],
                    "title": v["title"],
                    "duration": dur_str,
                    "transcript": [],
                    "quizzes": []
                })
                
            course_id = course["course_id"]
            COURSES_DATASET[course_id] = {
                "id": course_id,
                "title": course["title"],
                "instructor": course["instructor"],
                "category": course["topic"],
                "thumbnail": thumbnail,
                "description": f"A comprehensive {course['topic']} course by {course['instructor']}.",
                "videos": formatted_videos
            }
        print(f"Successfully loaded {len(dataset)} dynamic courses.")
    except Exception as e:
        print(f"Error loading dynamic dataset: {e}")

load_dynamic_courses()
load_admin_custom_data()
# ----------------------------

def get_video_by_id(video_id):
    for course_key, course in COURSES_DATASET.items():
        for vid in course["videos"]:
            if vid["id"] == video_id or vid["youtube_video_id"] == video_id:
                return course, vid
    first_course = list(COURSES_DATASET.values())[0]
    return first_course, first_course["videos"][0]

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "")
    password = data.get("password", "")
    
    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, name, email FROM users WHERE email = ? AND password = ?", (email, hashed_pw))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "status": "success", 
            "user": {"id": user[0], "name": user[1], "email": user[2]},
            "token": "fake-jwt-token-123"
        })
    else:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

@app.route("/api/courses", methods=["GET"])
def list_courses():
    summary = []
    for c_id, c in COURSES_DATASET.items():
        summary.append({
            "id": c["id"],
            "title": c["title"],
            "instructor": c["instructor"],
            "category": c["category"],
            "thumbnail": c["thumbnail"],
            "description": c["description"],
            "video_count": len(c["videos"]),
            "first_video_id": c["videos"][0]["id"] if c["videos"] else ""
        })
    return jsonify({"courses": summary})

@app.route("/api/videos/<video_id>", methods=["GET"])
def get_video_details(video_id):
    course, video = get_video_by_id(video_id)
    
    all_videos = course.get("videos", [])
    current_index = 0
    for i, v in enumerate(all_videos):
        if v["id"] == video["id"]:
            current_index = i
            break
            
    prev_video_id = all_videos[current_index - 1]["id"] if current_index > 0 else None
    next_video_id = all_videos[current_index + 1]["id"] if current_index < len(all_videos) - 1 else None
    
    all_course_videos = []
    for i, v in enumerate(all_videos):
        all_course_videos.append({
            "id": v["id"],
            "youtube_video_id": v.get("youtube_video_id", v["id"]),
            "title": v["title"],
            "duration": v["duration"],
            "sequence_order": i + 1
        })

    return jsonify({
        "course_id": course["id"],
        "course_title": course["title"],
        "instructor": course["instructor"],
        "video": video,
        "all_course_videos": all_course_videos,
        "current_video_index": current_index + 1,
        "total_course_videos": len(all_videos),
        "prev_video_id": prev_video_id,
        "next_video_id": next_video_id
    })

@app.route("/api/tutor/stream", methods=["POST"])
def tutor_stream_endpoint():
    data = request.get_json() or {}
    video_id = data.get("video_id", "python-setup-vars")
    student_question = data.get("question", "").strip()

    if not student_question:
        return jsonify({"error": "Question field is required"}), 400

    course, video = get_video_by_id(video_id)
    
    transcript_lines = [
        f"[{t['start']}s - {t['end']}s] {t['text']}" 
        for t in video.get("transcript", [])
    ]
    full_transcript = "\n".join(transcript_lines)

    system_prompt = (
        f"Your name is Coursai (كورساي). You are the official AI Tutor for the Coursai educational platform. You are a calm, academic, and highly precise educational assistant. "
        f"The student is currently watching the lesson titled '{video['title']}' taught by {course['instructor']} on the Coursai platform.\n\n"
        f"VIDEO TRANSCRIPT CONTEXT:\n{full_transcript}\n\n"
        f"CRITICAL RULES:\n"
        f"1. Answer the student's question based strictly and accurately on the provided video transcript above.\n"
        f"2. Reference approximate video timestamps (e.g., [01:15]) when citing facts mentioned in the transcript.\n"
        f"3. Maintain a dignified, clear, academic tone. Do not use informal jargon or emojis.\n"
        f"4. If the topic is not covered in this video transcript, state politely that the current lesson segment does not contain this information.\n"
        f"5. If asked about your identity, proudly state that your name is Coursai (كورساي) and you are the AI Tutor of the Coursai platform."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": student_question}
    ]

    def generate_sse_stream():
        try:
            ollama_url = f"{OLLAMA_BASE_URL}/api/chat"
            payload = {
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": 0.2
                }
            }
            
            response = requests.post(ollama_url, json=payload, stream=True, timeout=120)
            
            if response.status_code != 200:
                fallback_msg = f"Ollama error ({response.status_code}). Using transcript context mode."
                yield f"data: {json.dumps({'content': fallback_msg})}\n\n"
                return

            for line in response.iter_lines():
                if line:
                    decoded = line.decode("utf-8")
                    try:
                        chunk_json = json.loads(decoded)
                        content_piece = chunk_json.get("message", {}).get("content", "")
                        if content_piece:
                            yield f"data: {json.dumps({'content': content_piece})}\n\n"
                    except json.JSONDecodeError:
                        continue

            yield f"data: {json.dumps({'done': True})}\n\n"

        except requests.exceptions.RequestException:
            err_msg = (
                f"\n\n*[System Note: Local Ollama service at {OLLAMA_BASE_URL} is currently unreachable. "
                f"Displaying grounded transcript extract for video '{video['title']}']:*\n\n"
            )
            yield f"data: {json.dumps({'content': err_msg})}\n\n"
            
            simulated_response = (
                f"Based on the video transcript for **{video['title']}**:\n\n"
                f"The instructor ({course['instructor']}) explains that: "
                f"{video['transcript'][0]['text']} (Timestamp ~00:00).\n\n"
                f"For further details, refer to the timestamped video segments above."
            )
            for char_batch in [simulated_response[i:i+8] for i in range(0, len(simulated_response), 8)]:
                time.sleep(0.04)
                yield f"data: {json.dumps({'content': char_batch})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"

    return Response(generate_sse_stream(), mimetype="text/event-stream")

@app.route("/api/ai-search", methods=["POST"])
def ai_search():
    data = request.get_json() or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt field is required"}), 400

    # Prepare course summary for the AI
    course_summaries = []
    for c_id, c in COURSES_DATASET.items():
        c_summary = f"ID: {c['id']} | Title: {c['title']} | Category: {c['category']} | Instructor: {c['instructor']} | Lessons: {len(c['videos'])} | Description: {c['description']}"
        course_summaries.append(c_summary)
        
    all_courses_text = "\n".join(course_summaries)

    system_prompt = (
        "You are an expert AI Course Advisor for Coursai. "
        "Your task is to recommend the best courses from our catalog based on the user's request.\n\n"
        "AVAILABLE COURSES:\n"
        f"{all_courses_text}\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Respond ONLY with a valid JSON object.\n"
        "2. The JSON object must have exactly two keys: 'response' (a friendly, conversational string explaining your recommendations to the user based on their time and goals) and 'recommended_courses' (a list of string IDs of the recommended courses).\n"
        "3. Do not include markdown formatting like ```json or any other text outside the JSON object."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        ollama_url = f"{OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3
            }
        }
        
        response = requests.post(ollama_url, json=payload, timeout=60)
        
        if response.status_code == 200:
            content = response.json().get("message", {}).get("content", "")
            
            import re
            content = re.sub(r'^```json\s*', '', content.strip())
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            try:
                parsed_json = json.loads(content)
                if "response" in parsed_json and "recommended_courses" in parsed_json:
                    return jsonify(parsed_json)
            except json.JSONDecodeError:
                pass
                
    except requests.exceptions.RequestException:
        print("Ollama unreachable for AI Search")
        pass

    # Fallback Mechanism (if Ollama fails or returns bad JSON)
    prompt_lower = user_prompt.lower()
    recommended = []
    for c_id, c in COURSES_DATASET.items():
        if c['category'].lower() in prompt_lower or any(len(word) > 3 and word in prompt_lower for word in c['title'].lower().split()):
            recommended.append(c_id)
            
    if not recommended and COURSES_DATASET:
         recommended = [list(COURSES_DATASET.keys())[0]]
         
    fallback_response = {
        "response": f"I found {len(recommended)} course(s) that might match your interests based on your keywords (Our AI service is currently unavailable).",
        "recommended_courses": recommended[:3]
    }
    return jsonify(fallback_response)

# =============================================================================
# ADMIN DASHBOARD API ENDPOINTS (Courses, Lessons, Quizzes, Questions)
# =============================================================================

@app.route("/api/admin/courses", methods=["GET"])
def admin_list_courses():
    courses_list = []
    for c_id, c in COURSES_DATASET.items():
        total_quizzes = sum(len(v.get("quizzes", [])) for v in c.get("videos", []))
        courses_list.append({
            "id": c["id"],
            "title": c["title"],
            "instructor": c["instructor"],
            "category": c["category"],
            "thumbnail": c.get("thumbnail", ""),
            "description": c.get("description", ""),
            "video_count": len(c.get("videos", [])),
            "quiz_count": total_quizzes,
            "videos": c.get("videos", []),
            "is_custom": c.get("is_custom", False)
        })
    return jsonify({"courses": courses_list})

@app.route("/api/admin/courses", methods=["POST"])
def admin_create_course():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    instructor = data.get("instructor", "").strip()
    category = data.get("category", "Computer Science").strip()
    description = data.get("description", "").strip()
    youtube_input = data.get("youtube_video_id") or data.get("playlist_url") or "k9TUPpGqYTo"
    
    if not title or not instructor:
        return jsonify({"error": "Title and Instructor are required"}), 400

    clean_video_id = extract_youtube_id(youtube_input)
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')
    if not slug:
        slug = f"course-{int(time.time())}"
    course_id = f"{slug}-{uuid.uuid4().hex[:6]}"
    
    thumbnail = data.get("thumbnail") or f"https://img.youtube.com/vi/{clean_video_id}/hqdefault.jpg"
    video_id = clean_video_id
    
    course_obj = {
        "id": course_id,
        "title": title,
        "instructor": instructor,
        "category": category,
        "thumbnail": thumbnail,
        "description": description or f"A comprehensive {category} course by {instructor}.",
        "is_custom": True,
        "videos": [
            {
                "id": video_id,
                "youtube_video_id": clean_video_id,
                "title": f"Lesson 1: Introduction to {title}",
                "duration": "15:00",
                "transcript": [],
                "quizzes": []
            }
        ]
    }
    
    COURSES_DATASET[course_id] = course_obj
    save_course_to_db(course_obj)
    save_admin_custom_data()
    
    return jsonify({"status": "success", "course": course_obj})

@app.route("/api/admin/courses/<course_id>", methods=["PUT"])
def admin_update_course(course_id):
    if course_id not in COURSES_DATASET:
        return jsonify({"error": "Course not found"}), 404
        
    data = request.get_json() or {}
    course = COURSES_DATASET[course_id]
    
    if "title" in data and data["title"].strip():
        course["title"] = data["title"].strip()
    if "instructor" in data and data["instructor"].strip():
        course["instructor"] = data["instructor"].strip()
    if "category" in data and data["category"].strip():
        course["category"] = data["category"].strip()
    if "description" in data:
        course["description"] = data["description"].strip()
    if "thumbnail" in data and data["thumbnail"]:
        course["thumbnail"] = data["thumbnail"].strip()
        
    save_course_to_db(course)
    save_admin_custom_data()
    return jsonify({"status": "success", "course": course})

@app.route("/api/admin/courses/<course_id>", methods=["DELETE"])
def admin_delete_course(course_id):
    if course_id in COURSES_DATASET:
        del COURSES_DATASET[course_id]
    delete_course_from_db(course_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "message": f"Course {course_id} deleted"})

@app.route("/api/admin/courses/<course_id>/videos", methods=["POST"])
def admin_add_video_lesson(course_id):
    if course_id not in COURSES_DATASET:
        return jsonify({"error": "Course not found"}), 404
        
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    youtube_input = data.get("youtube_video_id", "").strip()
    duration = data.get("duration", "10:00").strip()
    
    if not title:
        return jsonify({"error": "Lesson title is required"}), 400
        
    clean_video_id = extract_youtube_id(youtube_input)
    existing_vids = [v["id"] for v in COURSES_DATASET[course_id].get("videos", [])]
    video_id = f"{clean_video_id}-{uuid.uuid4().hex[:4]}" if clean_video_id in existing_vids else clean_video_id
    
    video_obj = {
        "id": video_id,
        "youtube_video_id": clean_video_id,
        "title": title,
        "duration": duration or "10:00",
        "transcript": [],
        "quizzes": []
    }
    
    if "videos" not in COURSES_DATASET[course_id]:
        COURSES_DATASET[course_id]["videos"] = []
    COURSES_DATASET[course_id]["videos"].append(video_obj)
    
    save_course_to_db(COURSES_DATASET[course_id])
    save_admin_custom_data()
    return jsonify({"status": "success", "video": video_obj})

@app.route("/api/admin/courses/<course_id>/videos/<video_id>", methods=["DELETE"])
def admin_delete_video_lesson(course_id, video_id):
    if course_id not in COURSES_DATASET:
        return jsonify({"error": "Course not found"}), 404
        
    course = COURSES_DATASET[course_id]
    course["videos"] = [v for v in course.get("videos", []) if v["id"] != video_id]
    save_course_to_db(course)
    save_admin_custom_data()
    return jsonify({"status": "success", "message": f"Video {video_id} deleted"})

# Quizzes Management
@app.route("/api/admin/quizzes", methods=["GET"])
def admin_list_quizzes():
    quizzes_list = []
    seen_ids = set()
    
    for c_id, course in COURSES_DATASET.items():
        for vid in course.get("videos", []):
            for q in vid.get("quizzes", []):
                if q["id"] not in seen_ids:
                    seen_ids.add(q["id"])
                    quizzes_list.append({
                        "id": q["id"],
                        "title": q["title"],
                        "is_graded": q.get("is_graded", False),
                        "passing_score_percent": q.get("passing_score_percent", 70),
                        "course_id": c_id,
                        "course_title": course["title"],
                        "video_id": vid["id"],
                        "video_title": vid["title"],
                        "questions": q.get("questions", []),
                        "question_count": len(q.get("questions", []))
                    })
    return jsonify({"quizzes": quizzes_list})

@app.route("/api/admin/quizzes", methods=["POST"])
def admin_create_quiz():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    course_id = data.get("course_id", "")
    video_id = data.get("video_id", "")
    is_graded = bool(data.get("is_graded", False))
    passing_score = int(data.get("passing_score_percent", 70))
    questions_in = data.get("questions", [])
    
    if not title:
        return jsonify({"error": "Quiz title is required"}), 400
        
    target_course = COURSES_DATASET.get(course_id)
    if not target_course and COURSES_DATASET:
        target_course = list(COURSES_DATASET.values())[0]
        course_id = target_course["id"]
        
    target_video = None
    for vid in target_course.get("videos", []):
        if vid["id"] == video_id or vid.get("youtube_video_id") == video_id:
            target_video = vid
            break
            
    if not target_video and target_course.get("videos"):
        target_video = target_course["videos"][0]
        video_id = target_video["id"]
        
    if not target_video:
        return jsonify({"error": "No valid video found to attach quiz"}), 400

    quiz_id = f"quiz-{uuid.uuid4().hex[:8]}"
    
    formatted_questions = []
    for idx, q in enumerate(questions_in):
        q_text = q.get("question", "").strip()
        if not q_text:
            continue
        opts = [str(opt).strip() for opt in q.get("options", []) if str(opt).strip()]
        if len(opts) < 2:
            opts = ["True", "False"]
        c_idx = int(q.get("correct_index", 0))
        if c_idx >= len(opts) or c_idx < 0:
            c_idx = 0
        formatted_questions.append({
            "id": q.get("id") or f"q-{quiz_id}-{idx+1}",
            "question": q_text,
            "options": opts,
            "correct_index": c_idx,
            "explanation": q.get("explanation", "").strip()
        })
        
    if not formatted_questions:
        formatted_questions = [
            {
                "id": f"q-{quiz_id}-1",
                "question": f"Key concept assessment for: {title}?",
                "options": ["Correct Principle", "Alternative Concept", "Incorrect Option", "None of the above"],
                "correct_index": 0,
                "explanation": "Demonstrates core understanding of the lecture."
            }
        ]
        
    quiz_obj = {
        "id": quiz_id,
        "title": title,
        "is_graded": is_graded,
        "passing_score_percent": passing_score,
        "course_id": course_id,
        "video_id": video_id,
        "questions": formatted_questions,
        "is_custom": True
    }
    
    if "quizzes" not in target_video:
        target_video["quizzes"] = []
    target_video["quizzes"].append(quiz_obj)
    
    save_quiz_to_db(quiz_obj, course_id, video_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "quiz": quiz_obj})

@app.route("/api/admin/quizzes/<quiz_id>", methods=["PUT"])
def admin_update_quiz(quiz_id):
    data = request.get_json() or {}
    target_quiz = None
    target_course_id = None
    target_video_id = None
    
    for c_id, course in COURSES_DATASET.items():
        for vid in course.get("videos", []):
            for q in vid.get("quizzes", []):
                if q["id"] == quiz_id:
                    target_quiz = q
                    target_course_id = c_id
                    target_video_id = vid["id"]
                    break
                    
    if not target_quiz:
        return jsonify({"error": "Quiz not found"}), 404
        
    if "title" in data and data["title"].strip():
        target_quiz["title"] = data["title"].strip()
    if "is_graded" in data:
        target_quiz["is_graded"] = bool(data["is_graded"])
    if "passing_score_percent" in data:
        target_quiz["passing_score_percent"] = int(data["passing_score_percent"])
    if "questions" in data and isinstance(data["questions"], list):
        formatted_questions = []
        for idx, q in enumerate(data["questions"]):
            q_text = q.get("question", "").strip()
            if not q_text:
                continue
            opts = [str(opt).strip() for opt in q.get("options", []) if str(opt).strip()]
            if len(opts) < 2:
                opts = ["True", "False"]
            c_idx = int(q.get("correct_index", 0))
            if c_idx >= len(opts) or c_idx < 0:
                c_idx = 0
            formatted_questions.append({
                "id": q.get("id") or f"q-{quiz_id}-{idx+1}",
                "question": q_text,
                "options": opts,
                "correct_index": c_idx,
                "explanation": q.get("explanation", "").strip()
            })
        target_quiz["questions"] = formatted_questions
        
    save_quiz_to_db(target_quiz, target_course_id, target_video_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "quiz": target_quiz})

@app.route("/api/admin/quizzes/<quiz_id>", methods=["DELETE"])
def admin_delete_quiz(quiz_id):
    found = False
    for c_id, course in COURSES_DATASET.items():
        for vid in course.get("videos", []):
            if "quizzes" in vid:
                original_len = len(vid["quizzes"])
                vid["quizzes"] = [q for q in vid["quizzes"] if q["id"] != quiz_id]
                if len(vid["quizzes"]) < original_len:
                    found = True
                    
    delete_quiz_from_db(quiz_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "message": f"Quiz {quiz_id} deleted"})

@app.route("/api/admin/quizzes/<quiz_id>/questions", methods=["POST"])
def admin_add_question_to_quiz(quiz_id):
    data = request.get_json() or {}
    q_text = data.get("question", "").strip()
    options = [str(opt).strip() for opt in data.get("options", []) if str(opt).strip()]
    c_idx = int(data.get("correct_index", 0))
    explanation = data.get("explanation", "").strip()
    
    if not q_text:
        return jsonify({"error": "Question text is required"}), 400
    if len(options) < 2:
        options = ["Option A", "Option B"]
    if c_idx >= len(options) or c_idx < 0:
        c_idx = 0
        
    target_quiz = None
    target_course_id = None
    target_video_id = None
    
    for c_id, course in COURSES_DATASET.items():
        for vid in course.get("videos", []):
            for q in vid.get("quizzes", []):
                if q["id"] == quiz_id:
                    target_quiz = q
                    target_course_id = c_id
                    target_video_id = vid["id"]
                    break
                    
    if not target_quiz:
        return jsonify({"error": "Quiz not found"}), 404
        
    new_q_id = f"q-{quiz_id}-{len(target_quiz.get('questions', [])) + 1}-{uuid.uuid4().hex[:4]}"
    question_obj = {
        "id": new_q_id,
        "question": q_text,
        "options": options,
        "correct_index": c_idx,
        "explanation": explanation
    }
    
    if "questions" not in target_quiz:
        target_quiz["questions"] = []
    target_quiz["questions"].append(question_obj)
    
    save_quiz_to_db(target_quiz, target_course_id, target_video_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "question": question_obj})

@app.route("/api/admin/quizzes/<quiz_id>/questions/<question_id>", methods=["DELETE"])
def admin_delete_question_from_quiz(quiz_id, question_id):
    target_quiz = None
    target_course_id = None
    target_video_id = None
    
    for c_id, course in COURSES_DATASET.items():
        for vid in course.get("videos", []):
            for q in vid.get("quizzes", []):
                if q["id"] == quiz_id:
                    target_quiz = q
                    target_course_id = c_id
                    target_video_id = vid["id"]
                    break
                    
    if not target_quiz:
        return jsonify({"error": "Quiz not found"}), 404
        
    target_quiz["questions"] = [q for q in target_quiz.get("questions", []) if q["id"] != question_id]
    save_quiz_to_db(target_quiz, target_course_id, target_video_id)
    save_admin_custom_data()
    return jsonify({"status": "success", "message": f"Question {question_id} deleted"})

@app.route("/api/admin/generate-quiz", methods=["POST"])
def admin_generate_ai_quiz():
    data = request.get_json() or {}
    course_title = data.get("course_title", "Computer Science Course")
    video_title = data.get("video_title", "Introduction")
    category = data.get("category", "General")
    
    try:
        prompt = (
            f"Generate exactly 3 multiple choice questions for a quiz on '{video_title}' in the course '{course_title}' ({category}).\n"
            f"Output JSON array with schema: [{{'question': '...', 'options': ['opt1', 'opt2', 'opt3', 'opt4'], 'correct_index': 0, 'explanation': '...'}}].\n"
            f"Do not include any text other than valid JSON."
        )
        ollama_url = f"{OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {"temperature": 0.3}
        }
        res = requests.post(ollama_url, json=payload, timeout=8)
        if res.status_code == 200:
            content = res.json().get("message", {}).get("content", "").strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            parsed = json.loads(content)
            if isinstance(parsed, list) and len(parsed) > 0:
                return jsonify({"questions": parsed})
    except Exception as e:
        pass
        
    fallback_questions = [
        {
            "question": f"What is the main objective covered in '{video_title}'?",
            "options": [
                f"Master core concepts and fundamental syntax of {video_title}",
                "Memorize theoretical definitions without practical exercises",
                "Execute benchmarks exclusively on legacy mainframe systems",
                "Completely ignore design patterns and documentation"
            ],
            "correct_index": 0,
            "explanation": f"The focus of '{video_title}' is to build solid practical proficiency."
        },
        {
            "question": f"Which best practice is strongly recommended when developing in {course_title}?",
            "options": [
                "Writing clean, modular, and readable code with proper tests",
                "Combining all business logic and styling into a single monolithic file",
                "Disabling validation and exception handling for performance",
                "Hardcoding sensitive credentials directly in source files"
            ],
            "correct_index": 0,
            "explanation": "Modular, well-tested code ensures scalability, readability, and maintainability."
        },
        {
            "question": "What is the recommended approach to diagnose errors in this topic?",
            "options": [
                "Examine error messages, stack traces, and isolate variables methodically",
                "Delete the entire project repository and start over from scratch",
                "Ignore all warnings and deploy straight to production",
                "Comment out all lines that generate warnings"
            ],
            "correct_index": 0,
            "explanation": "Systematic debugging and inspecting stack traces quickly pinpoints root causes."
        }
    ]
    return jsonify({"questions": fallback_questions})

if __name__ == "__main__":
    print(f"Starting Coursai Flask Backend on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
