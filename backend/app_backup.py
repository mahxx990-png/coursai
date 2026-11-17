import json
import os
import time
import requests
from flask import Flask, request, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

def get_video_by_id(video_id):
    for course_key, course in COURSES_DATASET.items():
        for vid in course["videos"]:
            if vid["id"] == video_id or vid["youtube_video_id"] == video_id:
                return course, vid
    first_course = list(COURSES_DATASET.values())[0]
    return first_course, first_course["videos"][0]

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
    return jsonify({
        "course_id": course["id"],
        "course_title": course["title"],
        "instructor": course["instructor"],
        "video": video
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
        f"You are the Coursai AI Tutor, a calm, academic, and highly precise educational assistant. "
        f"The student is currently watching the lesson titled '{video['title']}' taught by {course['instructor']}.\n\n"
        f"VIDEO TRANSCRIPT CONTEXT:\n{full_transcript}\n\n"
        f"CRITICAL RULES:\n"
        f"1. Answer the student's question based strictly and accurately on the provided video transcript above.\n"
        f"2. Reference approximate video timestamps (e.g., [01:15]) when citing facts mentioned in the transcript.\n"
        f"3. Maintain a dignified, clear, academic tone. Do not use informal jargon or emojis.\n"
        f"4. If the topic is not covered in this video transcript, state politely that the current lesson segment does not contain this information."
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

if __name__ == "__main__":
    print(f"Starting Coursai Flask Backend on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
