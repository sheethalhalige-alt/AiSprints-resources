/**
 * Quiz Service
 * Handles quiz taking, attempts, and statistics for students
 */

import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
  toBoolean,
} from '@/lib/d1-client';

// ============================================
// Types & Interfaces
// ============================================

export interface QuizAttempt {
  id: string;
  studentId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  score: number;
  timeTakenSeconds: number | null;
  attemptDate: string;
}

export interface AttemptWithDetails extends QuizAttempt {
  questionText: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  selectedOptionText: string | null;
  correctOptionText: string;
  options: Array<{
    id: string;
    optionText: string;
    isCorrect: boolean;
    wasSelected: boolean;
  }>;
}

export interface SubmitAnswerInput {
  questionId: string;
  selectedOptionId: string;
  timeTakenSeconds?: number;
}

export interface SubmitAnswerResult {
  attemptId: string;
  isCorrect: boolean;
  score: number;
  correctOptionId: string;
  correctOptionText: string;
}

export interface StudentStatistics {
  totalAttempts: number;
  correctAttempts: number;
  totalScore: number;
  averageScore: number;
  successRate: number;
  categoryBreakdown: Array<{
    category: string;
    attempts: number;
    correct: number;
    successRate: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: 'easy' | 'medium' | 'hard';
    attempts: number;
    correct: number;
    successRate: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
}

export interface PaginatedAttempts {
  data: QuizAttempt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Database Row Interfaces (internal)
// ============================================

interface QuestionRow {
  id: string;
  points: number;
  instructor_id?: string;
}

interface OptionRow {
  id: string;
  is_correct: number;
  option_text: string;
  option_order?: number;
}

interface AttemptRow {
  id: string;
  student_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: number;
  score: number;
  time_taken_seconds: number | null;
  attempt_date: string;
  question_text?: string;
  category?: string | null;
  difficulty?: string;
}

interface OverallStatsRow {
  total_attempts: number;
  correct_attempts: number;
  total_score: number;
  avg_score: number | null;
}

interface CategoryStatsRow {
  category: string;
  attempts: number;
  correct: number;
}

interface DifficultyStatsRow {
  difficulty: string;
  attempts: number;
  correct: number;
}

interface LeaderboardRow {
  student_id: string;
  student_name: string;
  total_score: number;
  total_attempts: number;
  correct_attempts: number;
}

interface QuestionAttemptRow {
  student_name: string;
  is_correct: number;
  attempt_date: string;
}

// ============================================
// Quiz Service Class
// ============================================

export class QuizService {
  /**
   * Submit an answer for a question
   */
  static async submitAnswer(
    studentId: string,
    input: SubmitAnswerInput
  ): Promise<SubmitAnswerResult> {
    console.log('📝 Submitting answer for question:', input.questionId);

    // Validate input
    if (!input.questionId || !input.selectedOptionId) {
      throw new Error('Question ID and selected option are required');
    }

    // Verify question exists
    const question = await executeQueryFirst<QuestionRow>(
      'SELECT id, points FROM questions WHERE id = ?',
      [input.questionId]
    );

    if (!question) {
      throw new Error('Question not found');
    }

    // Verify option belongs to question and get correct answer
    const selectedOption = await executeQueryFirst<OptionRow>(
      'SELECT id, is_correct FROM options WHERE id = ? AND question_id = ?',
      [input.selectedOptionId, input.questionId]
    );

    if (!selectedOption) {
      throw new Error('Selected option not found for this question');
    }

    // Get correct option
    const correctOption = await executeQueryFirst<OptionRow>(
      'SELECT id, option_text FROM options WHERE question_id = ? AND is_correct = 1',
      [input.questionId]
    );

    if (!correctOption) {
      throw new Error('Correct answer not found for this question');
    }

    // Calculate if answer is correct
    const isCorrect = toBoolean(selectedOption.is_correct);
    const score = isCorrect ? (question.points as number) : 0;

    // Record the attempt
    const attemptId = generateId();
    await executeMutation(
      `INSERT INTO quiz_attempts 
       (id, student_id, question_id, selected_option_id, is_correct, score, time_taken_seconds, attempt_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        studentId,
        input.questionId,
        input.selectedOptionId,
        isCorrect ? 1 : 0,
        score,
        input.timeTakenSeconds ?? null,
        new Date().toISOString(),
      ]
    );

    console.log('✅ Answer submitted:', { isCorrect, score });

    return {
      attemptId,
      isCorrect,
      score,
      correctOptionId: correctOption.id as string,
      correctOptionText: correctOption.option_text as string,
    };
  }

  /**
   * Get student's attempt history with pagination
   */
  static async getStudentAttempts(
    studentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedAttempts> {
    console.log('📋 Getting attempts for student:', studentId);

    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    // Get total count
    const countResult = await executeQueryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ?',
      [studentId]
    );
    const total = countResult?.count ?? 0;

    // Get paginated attempts
    const attempts = await executeQuery<AttemptRow>(
      `SELECT qa.id, qa.student_id, qa.question_id, qa.selected_option_id,
              qa.is_correct, qa.score, qa.time_taken_seconds, qa.attempt_date,
              q.question_text, q.category, q.difficulty
       FROM quiz_attempts qa
       JOIN questions q ON q.id = qa.question_id
       WHERE qa.student_id = ?
       ORDER BY qa.attempt_date DESC
       LIMIT ? OFFSET ?`,
      [studentId, safeLimit, offset]
    );

    const data: QuizAttempt[] = attempts.map((row) => ({
      id: row.id as string,
      studentId: row.student_id as string,
      questionId: row.question_id as string,
      selectedOptionId: row.selected_option_id as string | null,
      isCorrect: toBoolean(row.is_correct),
      score: row.score as number,
      timeTakenSeconds: row.time_taken_seconds as number | null,
      attemptDate: row.attempt_date as string,
    }));

    console.log('✓ Found', total, 'attempts');

    return {
      data,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Get a specific attempt with full details
   */
  static async getAttemptById(
    attemptId: string,
    studentId: string
  ): Promise<AttemptWithDetails | null> {
    console.log('🔍 Getting attempt:', attemptId);

    // Get attempt with question info
    const attempt = await executeQueryFirst<AttemptRow>(
      `SELECT qa.id, qa.student_id, qa.question_id, qa.selected_option_id,
              qa.is_correct, qa.score, qa.time_taken_seconds, qa.attempt_date,
              q.question_text, q.category, q.difficulty
       FROM quiz_attempts qa
       JOIN questions q ON q.id = qa.question_id
       WHERE qa.id = ? AND qa.student_id = ?`,
      [attemptId, studentId]
    );

    if (!attempt) {
      console.log('❌ Attempt not found');
      return null;
    }

    // Get all options for the question
    const optionRows = await executeQuery<OptionRow>(
      `SELECT id, option_text, is_correct, option_order
       FROM options WHERE question_id = ? ORDER BY option_order`,
      [attempt.question_id]
    );

    const options = optionRows.map((row) => ({
      id: row.id as string,
      optionText: row.option_text as string,
      isCorrect: toBoolean(row.is_correct),
      wasSelected: row.id === attempt.selected_option_id,
    }));

    const correctOption = options.find((o) => o.isCorrect);
    const selectedOption = options.find((o) => o.wasSelected);

    console.log('✓ Attempt details retrieved');

    return {
      id: attempt.id as string,
      studentId: attempt.student_id as string,
      questionId: attempt.question_id as string,
      selectedOptionId: attempt.selected_option_id as string | null,
      isCorrect: toBoolean(attempt.is_correct),
      score: attempt.score as number,
      timeTakenSeconds: attempt.time_taken_seconds as number | null,
      attemptDate: attempt.attempt_date as string,
      questionText: attempt.question_text as string,
      category: attempt.category as string | null,
      difficulty: attempt.difficulty as 'easy' | 'medium' | 'hard',
      selectedOptionText: selectedOption?.optionText ?? null,
      correctOptionText: correctOption?.optionText ?? '',
      options,
    };
  }

  /**
   * Get comprehensive statistics for a student
   */
  static async getStudentStatistics(studentId: string): Promise<StudentStatistics> {
    console.log('📊 Getting statistics for student:', studentId);

    // Overall statistics
    const overall = await executeQueryFirst<OverallStatsRow>(
      `SELECT 
         COUNT(*) as total_attempts,
         SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
         SUM(score) as total_score,
         AVG(score) as avg_score
       FROM quiz_attempts
       WHERE student_id = ?`,
      [studentId]
    );

    // Category breakdown
    const categoryStats = await executeQuery<CategoryStatsRow>(
      `SELECT 
         COALESCE(q.category, 'Uncategorized') as category,
         COUNT(*) as attempts,
         SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM quiz_attempts qa
       JOIN questions q ON q.id = qa.question_id
       WHERE qa.student_id = ?
       GROUP BY q.category
       ORDER BY attempts DESC`,
      [studentId]
    );

    // Difficulty breakdown
    const difficultyStats = await executeQuery<DifficultyStatsRow>(
      `SELECT 
         q.difficulty,
         COUNT(*) as attempts,
         SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM quiz_attempts qa
       JOIN questions q ON q.id = qa.question_id
       WHERE qa.student_id = ?
       GROUP BY q.difficulty
       ORDER BY 
         CASE q.difficulty 
           WHEN 'easy' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'hard' THEN 3 
         END`,
      [studentId]
    );

    const totalAttempts = (overall?.total_attempts as number) || 0;
    const correctAttempts = (overall?.correct_attempts as number) || 0;

    console.log('✓ Statistics calculated');

    return {
      totalAttempts,
      correctAttempts,
      totalScore: (overall?.total_score as number) || 0,
      averageScore: overall?.avg_score ? Math.round((overall.avg_score as number) * 100) / 100 : 0,
      successRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      categoryBreakdown: categoryStats.map((row) => ({
        category: row.category as string,
        attempts: row.attempts as number,
        correct: (row.correct as number) || 0,
        successRate:
          row.attempts > 0 ? Math.round(((row.correct as number) / (row.attempts as number)) * 100) : 0,
      })),
      difficultyBreakdown: difficultyStats.map((row) => ({
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
        attempts: row.attempts as number,
        correct: (row.correct as number) || 0,
        successRate:
          row.attempts > 0 ? Math.round(((row.correct as number) / (row.attempts as number)) * 100) : 0,
      })),
    };
  }

  /**
   * Get the leaderboard of top students
   */
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    console.log('🏆 Getting leaderboard, top', limit);

    const safeLimit = Math.min(limit, 100);

    const rows = await executeQuery<LeaderboardRow>(
      `SELECT 
         u.id as student_id,
         u.name as student_name,
         SUM(qa.score) as total_score,
         COUNT(*) as total_attempts,
         SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.student_id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY total_score DESC, correct_attempts DESC
       LIMIT ?`,
      [safeLimit]
    );

    const leaderboard: LeaderboardEntry[] = rows.map((row, index) => ({
      rank: index + 1,
      studentId: row.student_id as string,
      studentName: row.student_name as string,
      totalScore: (row.total_score as number) || 0,
      totalAttempts: row.total_attempts as number,
      correctAttempts: (row.correct_attempts as number) || 0,
      successRate:
        row.total_attempts > 0
          ? Math.round(((row.correct_attempts as number) / (row.total_attempts as number)) * 100)
          : 0,
    }));

    console.log('✓ Leaderboard retrieved with', leaderboard.length, 'entries');
    return leaderboard;
  }

  /**
   * Get recent attempts for a specific question (for instructors)
   */
  static async getQuestionAttempts(
    questionId: string,
    instructorId: string,
    limit: number = 50
  ): Promise<Array<{ studentName: string; isCorrect: boolean; attemptDate: string }>> {
    console.log('📋 Getting attempts for question:', questionId);

    // Verify ownership
    const question = await executeQueryFirst<QuestionRow>(
      'SELECT id, instructor_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.instructor_id !== instructorId) {
      throw new Error('You do not have permission to view this question\'s attempts');
    }

    const safeLimit = Math.min(limit, 100);

    const rows = await executeQuery<QuestionAttemptRow>(
      `SELECT 
         u.name as student_name,
         qa.is_correct,
         qa.attempt_date
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.student_id
       WHERE qa.question_id = ?
       ORDER BY qa.attempt_date DESC
       LIMIT ?`,
      [questionId, safeLimit]
    );

    console.log('✓ Found', rows.length, 'attempts');

    return rows.map((row) => ({
      studentName: row.student_name as string,
      isCorrect: toBoolean(row.is_correct),
      attemptDate: row.attempt_date as string,
    }));
  }

  /**
   * Check if a student has already attempted a question
   */
  static async hasAttemptedQuestion(studentId: string, questionId: string): Promise<boolean> {
    const result = await executeQueryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ? AND question_id = ?',
      [studentId, questionId]
    );

    return (result?.count ?? 0) > 0;
  }

  /**
   * Get count of available questions for a student
   */
  static async getAvailableQuestionCount(
    studentId: string,
    excludeAttempted: boolean = false,
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<number> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (excludeAttempted) {
      conditions.push(
        'q.id NOT IN (SELECT DISTINCT question_id FROM quiz_attempts WHERE student_id = ?)'
      );
      params.push(studentId);
    }

    if (category) {
      conditions.push('q.category = ?');
      params.push(category);
    }

    if (difficulty) {
      conditions.push('q.difficulty = ?');
      params.push(difficulty);
    }

    const result = await executeQueryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions q WHERE ${conditions.join(' AND ')}`,
      params
    );

    return result?.count ?? 0;
  }
}

