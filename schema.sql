-- =============================================================================
-- COURSAI EDUCATIONAL PLATFORM - DATABASE SCHEMA
-- Relational SQL Schema for Courses, Videos, Transcripts, Quizzes & AI Chats
-- Compatible with PostgreSQL / SQLite / MySQL
-- =============================================================================

-- Drop existing tables if re-initializing (Order respects FK constraints)
DROP TABLE IF EXISTS ai_chat_messages;
DROP TABLE IF EXISTS ai_chat_sessions;
DROP TABLE IF EXISTS student_quiz_attempts;
DROP TABLE IF EXISTS quiz_options;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS video_transcripts;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS courses;

-- -----------------------------------------------------------------------------
-- 1. COURSES TABLE
-- Stores metadata for overall educational tracks/series
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
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

-- -----------------------------------------------------------------------------
-- 2. VIDEOS TABLE
-- Represents individual YouTube lessons contained within a course
-- -----------------------------------------------------------------------------
CREATE TABLE videos (
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

CREATE INDEX idx_videos_course_id ON videos(course_id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_video_id);

-- -----------------------------------------------------------------------------
-- 3. VIDEO TRANSCRIPTS TABLE
-- Stores timestamped transcript chunks for AI context retrieval & RAG
-- -----------------------------------------------------------------------------
CREATE TABLE video_transcripts (
    id VARCHAR(64) PRIMARY KEY,
    video_id VARCHAR(64) NOT NULL,
    start_time_seconds FLOAT NOT NULL,
    end_time_seconds FLOAT NOT NULL,
    text_content TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_transcripts_video_id ON video_transcripts(video_id);
CREATE INDEX idx_transcripts_time_range ON video_transcripts(video_id, start_time_seconds);

-- -----------------------------------------------------------------------------
-- 4. QUIZZES TABLE
-- Stores assessment definitions linked directly to specific videos
-- -----------------------------------------------------------------------------
CREATE TABLE quizzes (
    id VARCHAR(64) PRIMARY KEY,
    video_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    passing_score_percent INT NOT NULL DEFAULT 70,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_quizzes_video_id ON quizzes(video_id);

-- -----------------------------------------------------------------------------
-- 5. QUIZ QUESTIONS TABLE
-- Stores multiple-choice questions for each quiz
-- -----------------------------------------------------------------------------
CREATE TABLE quiz_questions (
    id VARCHAR(64) PRIMARY KEY,
    quiz_id VARCHAR(64) NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    sequence_order INT NOT NULL DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- -----------------------------------------------------------------------------
-- 6. QUIZ OPTIONS TABLE
-- Stores selectable answer options for each question
-- -----------------------------------------------------------------------------
CREATE TABLE quiz_options (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);

-- -----------------------------------------------------------------------------
-- 7. STUDENT QUIZ ATTEMPTS TABLE
-- Tracks student assessment scores and completions
-- -----------------------------------------------------------------------------
CREATE TABLE student_quiz_attempts (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    quiz_id VARCHAR(64) NOT NULL,
    score_percent INT NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_attempts_student_quiz ON student_quiz_attempts(student_id, quiz_id);

-- -----------------------------------------------------------------------------
-- 8. AI CHAT SESSIONS & MESSAGES TABLES
-- Persists student conversation logs with the AI Tutor
-- -----------------------------------------------------------------------------
CREATE TABLE ai_chat_sessions (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    video_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE ai_chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    sender_role VARCHAR(16) NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_session ON ai_chat_messages(session_id, created_at);
