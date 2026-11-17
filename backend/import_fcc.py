import json
import os
import requests

# =============================================================================
# OFFICIAL FREECODECAMP COURSES DATASET IMPORTER
# Imports freeCodeCamp's open curriculum courses directly into Coursai
# =============================================================================

FCC_OFFICIAL_COURSES = [
    {
        "course_id": "fcc-python-cert",
        "title": "Scientific Computing with Python Certification",
        "instructor": "freeCodeCamp.org",
        "category": "Computer Science",
        "platform": "YouTube",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIAG5M3Wp07k-D1d51_C2T0nS",
        "description": "Learn core Python programming, data structures, algorithms, and build 5 certification projects with freeCodeCamp."
    },
    {
        "course_id": "fcc-data-analysis",
        "title": "Data Analysis with Python Full Course",
        "instructor": "freeCodeCamp.org",
        "category": "Data Science",
        "platform": "YouTube",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIAB4-R6a1cvrX2E3cM-Mv0vQ",
        "description": "Master Numpy, Pandas, Matplotlib, and Seaborn for data analysis and visualization."
    },
    {
        "course_id": "fcc-machine-learning-py",
        "title": "Machine Learning with Python Course",
        "instructor": "freeCodeCamp.org",
        "category": "Artificial Intelligence",
        "platform": "YouTube",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIAB5VzBvM4sB9c0N3Q2Zp2m5",
        "description": "Learn TensorFlow, neural networks, computer vision, and NLP in Python."
    },
    {
        "course_id": "fcc-js-algorithms",
        "title": "JavaScript Algorithms & Data Structures",
        "instructor": "freeCodeCamp.org",
        "category": "Web Development",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIABcB3LgZ6oT40W0S6mS2C5",
        "description": "Master ES6+ JavaScript, object oriented programming, functional programming, and data structures."
    },
    {
        "course_id": "fcc-relational-db",
        "title": "Relational Database & SQL Certification",
        "instructor": "freeCodeCamp.org",
        "category": "Databases",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIAG5M3Wp07k-D1d51_C2T0nT",
        "description": "Learn PostgreSQL, Bash scripting, and SQL relational database design."
    },
    {
        "course_id": "fcc-responsive-web",
        "title": "Responsive Web Design Certification",
        "instructor": "freeCodeCamp.org",
        "category": "Web Development",
        "playlist_url": "https://www.youtube.com/playlist?list=PLWKjhJtBOIABcB3LgZ6oT40W0S6mS2C7",
        "description": "Build responsive websites using modern HTML5, CSS3, Flexbox, and CSS Grid."
    }
]

DATASET_FILE = os.path.join(os.path.dirname(__file__), "courses_dataset_100.json")

def import_freecodecamp():
    print("[Importer] Loading freeCodeCamp courses dataset...")
    existing = []
    if os.path.exists(DATASET_FILE):
        with open(DATASET_FILE, "r", encoding="utf-8") as f:
            existing = json.load(f)

    existing_ids = {c["course_id"] for c in existing}
    added_count = 0

    for fcc_course in FCC_OFFICIAL_COURSES:
        if fcc_course["course_id"] not in existing_ids:
            existing.insert(0, fcc_course)
            added_count += 1

    with open(DATASET_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"[Success] Added {added_count} freeCodeCamp courses into courses_dataset_100.json!")
    print("Restart your Flask backend or refresh the browser to see the new freeCodeCamp courses.")

if __name__ == "__main__":
    import_freecodecamp()
