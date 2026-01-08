-- Migration: Create MCQ Tables for QuizMaker Application
-- This migration creates the questions, options, and quiz_attempts tables

-- ============================================
-- Questions Table
-- ============================================
-- Stores quiz questions created by instructors
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups by instructor
CREATE INDEX IF NOT EXISTS idx_questions_instructor_id ON questions(instructor_id);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- ============================================
-- Options Table
-- ============================================
-- Stores answer options for each question (4 or 6 options per question)
CREATE TABLE IF NOT EXISTS options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  option_order INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Index for faster lookups by question
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);

-- ============================================
-- Quiz Attempts Table
-- ============================================
-- Tracks student quiz attempts with scoring
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT,
  is_correct INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE SET NULL
);

-- Index for student attempt history
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);

-- Index for question statistics
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question_id ON quiz_attempts(question_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempt_date ON quiz_attempts(attempt_date);


