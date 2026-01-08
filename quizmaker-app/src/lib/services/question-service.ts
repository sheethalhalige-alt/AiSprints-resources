/**
 * Question Service
 * Handles CRUD operations for quiz questions (instructor functionality)
 */

import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
  toBoolean,
  fromBoolean,
} from '@/lib/d1-client';

// ============================================
// Types & Interfaces
// ============================================

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface Question {
  id: string;
  instructorId: string;
  questionText: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  createdAt: string;
  updatedAt: string;
  options?: QuestionOption[];
}

export interface CreateQuestionInput {
  questionText: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points?: number;
  options: Array<{
    optionText: string;
    isCorrect: boolean;
  }>;
}

export interface UpdateQuestionInput {
  questionText?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  options?: Array<{
    optionText: string;
    isCorrect: boolean;
  }>;
}

export interface ListQuestionsParams {
  instructorId: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionStatistics {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeSeconds: number | null;
  optionDistribution: Array<{
    optionId: string;
    optionText: string;
    isCorrect: boolean;
    selectionCount: number;
    selectionPercentage: number;
  }>;
}

// ============================================
// Question Service Class
// ============================================

export class QuestionService {
  /**
   * Create a new question with options
   */
  static async createQuestion(
    instructorId: string,
    input: CreateQuestionInput
  ): Promise<Question> {
    console.log('📝 Creating new question...');

    // Validate question text
    if (!input.questionText || input.questionText.trim().length < 10) {
      throw new Error('Question text must be at least 10 characters');
    }
    if (input.questionText.length > 1000) {
      throw new Error('Question text must not exceed 1000 characters');
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(input.difficulty)) {
      throw new Error('Difficulty must be easy, medium, or hard');
    }

    // Validate options
    if (!input.options || (input.options.length !== 4 && input.options.length !== 6)) {
      throw new Error('Question must have exactly 4 or 6 options');
    }

    const correctOptions = input.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error('Question must have exactly one correct answer');
    }

    // Validate each option text
    for (const opt of input.options) {
      if (!opt.optionText || opt.optionText.trim().length < 1) {
        throw new Error('Option text cannot be empty');
      }
      if (opt.optionText.length > 500) {
        throw new Error('Option text must not exceed 500 characters');
      }
    }

    // Validate points
    const points = input.points ?? 1;
    if (points < 1) {
      throw new Error('Points must be at least 1');
    }

    console.log('✓ Input validation passed');

    // Generate question ID
    const questionId = generateId();
    const now = new Date().toISOString();

    // Insert question
    await executeMutation(
      `INSERT INTO questions (id, instructor_id, question_text, category, difficulty, points, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionId,
        instructorId,
        input.questionText.trim(),
        input.category?.trim() || null,
        input.difficulty,
        points,
        now,
        now,
      ]
    );

    console.log('✓ Question inserted with ID:', questionId);

    // Insert options using batch
    const optionStatements = input.options.map((opt, index) => ({
      sql: `INSERT INTO options (id, question_id, option_text, is_correct, option_order)
            VALUES (?, ?, ?, ?, ?)`,
      params: [
        generateId(),
        questionId,
        opt.optionText.trim(),
        fromBoolean(opt.isCorrect),
        index + 1,
      ],
    }));

    await executeBatch(optionStatements);
    console.log('✓ Options inserted:', input.options.length);

    // Return the created question with options
    const question = await this.getQuestionById(questionId, instructorId);
    if (!question) {
      throw new Error('Failed to retrieve created question');
    }

    console.log('✅ Question created successfully');
    return question;
  }

  /**
   * Get a question by ID with ownership verification
   */
  static async getQuestionById(
    questionId: string,
    requesterId: string,
    requesterRole?: 'student' | 'instructor'
  ): Promise<Question | null> {
    console.log('🔍 Fetching question:', questionId);

    const questionRow = await executeQueryFirst<any>(
      `SELECT id, instructor_id, question_text, category, difficulty, points, created_at, updated_at
       FROM questions WHERE id = ?`,
      [questionId]
    );

    if (!questionRow) {
      console.log('❌ Question not found');
      return null;
    }

    // Fetch options
    const optionRows = await executeQuery<any>(
      `SELECT id, option_text, is_correct, option_order
       FROM options WHERE question_id = ? ORDER BY option_order`,
      [questionId]
    );

    // Map options - hide correct answer from students during quiz
    const hideCorrectAnswer = requesterRole === 'student';
    const options: QuestionOption[] = optionRows.map((row) => ({
      id: row.id as string,
      optionText: row.option_text as string,
      isCorrect: hideCorrectAnswer ? false : toBoolean(row.is_correct),
      optionOrder: row.option_order as number,
    }));

    const question: Question = {
      id: questionRow.id as string,
      instructorId: questionRow.instructor_id as string,
      questionText: questionRow.question_text as string,
      category: questionRow.category as string | null,
      difficulty: questionRow.difficulty as 'easy' | 'medium' | 'hard',
      points: questionRow.points as number,
      createdAt: questionRow.created_at as string,
      updatedAt: questionRow.updated_at as string,
      options,
    };

    console.log('✓ Question fetched with', options.length, 'options');
    return question;
  }

  /**
   * List questions for an instructor with pagination and filtering
   */
  static async listQuestions(
    params: ListQuestionsParams
  ): Promise<PaginatedResult<Question>> {
    console.log('📋 Listing questions for instructor:', params.instructorId);

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = ['q.instructor_id = ?'];
    const queryParams: any[] = [params.instructorId];

    if (params.search) {
      conditions.push('q.question_text LIKE ?');
      queryParams.push(`%${params.search}%`);
    }

    if (params.category) {
      conditions.push('q.category = ?');
      queryParams.push(params.category);
    }

    if (params.difficulty) {
      conditions.push('q.difficulty = ?');
      queryParams.push(params.difficulty);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await executeQueryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions q WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult?.count ?? 0;

    // Get paginated questions
    const questions = await executeQuery<any>(
      `SELECT q.id, q.instructor_id, q.question_text, q.category, q.difficulty, 
              q.points, q.created_at, q.updated_at,
              (SELECT COUNT(*) FROM options WHERE question_id = q.id) as option_count
       FROM questions q
       WHERE ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Map to Question objects (without options for list view)
    const data: Question[] = questions.map((row) => ({
      id: row.id as string,
      instructorId: row.instructor_id as string,
      questionText: row.question_text as string,
      category: row.category as string | null,
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      points: row.points as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    console.log('✓ Found', total, 'questions, returning page', page);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a question (with ownership verification)
   */
  static async updateQuestion(
    questionId: string,
    instructorId: string,
    input: UpdateQuestionInput
  ): Promise<Question> {
    console.log('✏️ Updating question:', questionId);

    // Verify ownership
    const existing = await executeQueryFirst<any>(
      'SELECT id, instructor_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!existing) {
      throw new Error('Question not found');
    }

    if (existing.instructor_id !== instructorId) {
      throw new Error('You do not have permission to update this question');
    }

    // Build update fields
    const updates: string[] = [];
    const updateParams: any[] = [];

    if (input.questionText !== undefined) {
      if (input.questionText.trim().length < 10) {
        throw new Error('Question text must be at least 10 characters');
      }
      if (input.questionText.length > 1000) {
        throw new Error('Question text must not exceed 1000 characters');
      }
      updates.push('question_text = ?');
      updateParams.push(input.questionText.trim());
    }

    if (input.category !== undefined) {
      updates.push('category = ?');
      updateParams.push(input.category?.trim() || null);
    }

    if (input.difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(input.difficulty)) {
        throw new Error('Difficulty must be easy, medium, or hard');
      }
      updates.push('difficulty = ?');
      updateParams.push(input.difficulty);
    }

    if (input.points !== undefined) {
      if (input.points < 1) {
        throw new Error('Points must be at least 1');
      }
      updates.push('points = ?');
      updateParams.push(input.points);
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    updateParams.push(new Date().toISOString());

    // Update question if there are changes
    if (updates.length > 0) {
      await executeMutation(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
        [...updateParams, questionId]
      );
      console.log('✓ Question fields updated');
    }

    // Update options if provided
    if (input.options !== undefined) {
      // Validate options
      if (input.options.length !== 4 && input.options.length !== 6) {
        throw new Error('Question must have exactly 4 or 6 options');
      }

      const correctOptions = input.options.filter((opt) => opt.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error('Question must have exactly one correct answer');
      }

      for (const opt of input.options) {
        if (!opt.optionText || opt.optionText.trim().length < 1) {
          throw new Error('Option text cannot be empty');
        }
        if (opt.optionText.length > 500) {
          throw new Error('Option text must not exceed 500 characters');
        }
      }

      // Delete existing options
      await executeMutation('DELETE FROM options WHERE question_id = ?', [questionId]);
      console.log('✓ Existing options deleted');

      // Insert new options
      const optionStatements = input.options.map((opt, index) => ({
        sql: `INSERT INTO options (id, question_id, option_text, is_correct, option_order)
              VALUES (?, ?, ?, ?, ?)`,
        params: [
          generateId(),
          questionId,
          opt.optionText.trim(),
          fromBoolean(opt.isCorrect),
          index + 1,
        ],
      }));

      await executeBatch(optionStatements);
      console.log('✓ New options inserted:', input.options.length);
    }

    // Return updated question
    const updated = await this.getQuestionById(questionId, instructorId);
    if (!updated) {
      throw new Error('Failed to retrieve updated question');
    }

    console.log('✅ Question updated successfully');
    return updated;
  }

  /**
   * Delete a question (with ownership verification)
   */
  static async deleteQuestion(
    questionId: string,
    instructorId: string,
    force: boolean = false
  ): Promise<{ deleted: boolean; message: string }> {
    console.log('🗑️ Deleting question:', questionId);

    // Verify ownership
    const existing = await executeQueryFirst<any>(
      'SELECT id, instructor_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!existing) {
      throw new Error('Question not found');
    }

    if (existing.instructor_id !== instructorId) {
      throw new Error('You do not have permission to delete this question');
    }

    // Check for quiz attempts
    if (!force) {
      const attemptCount = await executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM quiz_attempts WHERE question_id = ?',
        [questionId]
      );

      if (attemptCount && attemptCount.count > 0) {
        throw new Error(
          `Cannot delete question with ${attemptCount.count} quiz attempts. ` +
          'Use force=true to delete anyway (this will also delete all attempts).'
        );
      }
    }

    // Delete question (CASCADE will handle options and attempts)
    await executeMutation('DELETE FROM questions WHERE id = ?', [questionId]);

    console.log('✅ Question deleted successfully');
    return {
      deleted: true,
      message: force
        ? 'Question and associated data deleted successfully'
        : 'Question deleted successfully',
    };
  }

  /**
   * Get a random question for quiz (optionally excluding already attempted)
   */
  static async getRandomQuestion(
    studentId: string,
    excludeAttempted: boolean = false,
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<Question | null> {
    console.log('🎲 Getting random question for student:', studentId);

    // Build WHERE clause
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (excludeAttempted) {
      conditions.push(
        'q.id NOT IN (SELECT DISTINCT question_id FROM quiz_attempts WHERE student_id = ?)'
      );
      queryParams.push(studentId);
    }

    if (category) {
      conditions.push('q.category = ?');
      queryParams.push(category);
    }

    if (difficulty) {
      conditions.push('q.difficulty = ?');
      queryParams.push(difficulty);
    }

    const whereClause = conditions.join(' AND ');

    // Get random question
    const questionRow = await executeQueryFirst<any>(
      `SELECT q.id, q.instructor_id, q.question_text, q.category, q.difficulty, 
              q.points, q.created_at, q.updated_at
       FROM questions q
       WHERE ${whereClause}
       ORDER BY RANDOM()
       LIMIT 1`,
      queryParams
    );

    if (!questionRow) {
      console.log('❌ No questions available');
      return null;
    }

    // Get options (hiding correct answer from student)
    const optionRows = await executeQuery<any>(
      `SELECT id, option_text, is_correct, option_order
       FROM options WHERE question_id = ? ORDER BY option_order`,
      [questionRow.id]
    );

    const options: QuestionOption[] = optionRows.map((row) => ({
      id: row.id as string,
      optionText: row.option_text as string,
      isCorrect: false, // Always hide for quiz
      optionOrder: row.option_order as number,
    }));

    const question: Question = {
      id: questionRow.id as string,
      instructorId: questionRow.instructor_id as string,
      questionText: questionRow.question_text as string,
      category: questionRow.category as string | null,
      difficulty: questionRow.difficulty as 'easy' | 'medium' | 'hard',
      points: questionRow.points as number,
      createdAt: questionRow.created_at as string,
      updatedAt: questionRow.updated_at as string,
      options,
    };

    console.log('✓ Random question selected:', question.id);
    return question;
  }

  /**
   * Get question statistics for instructors
   */
  static async getQuestionStatistics(
    questionId: string,
    instructorId: string
  ): Promise<QuestionStatistics> {
    console.log('📊 Getting statistics for question:', questionId);

    // Verify ownership
    const question = await executeQueryFirst<any>(
      'SELECT id, instructor_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.instructor_id !== instructorId) {
      throw new Error('You do not have permission to view this question\'s statistics');
    }

    // Get overall statistics
    const stats = await executeQueryFirst<any>(
      `SELECT 
         COUNT(*) as total_attempts,
         SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
         AVG(time_taken_seconds) as avg_time
       FROM quiz_attempts
       WHERE question_id = ?`,
      [questionId]
    );

    // Get option distribution
    const optionStats = await executeQuery<any>(
      `SELECT 
         o.id as option_id,
         o.option_text,
         o.is_correct,
         COUNT(qa.id) as selection_count
       FROM options o
       LEFT JOIN quiz_attempts qa ON qa.selected_option_id = o.id
       WHERE o.question_id = ?
       GROUP BY o.id
       ORDER BY o.option_order`,
      [questionId]
    );

    const totalAttempts = (stats?.total_attempts as number) || 0;
    const correctAttempts = (stats?.correct_attempts as number) || 0;

    const optionDistribution = optionStats.map((row) => ({
      optionId: row.option_id as string,
      optionText: row.option_text as string,
      isCorrect: toBoolean(row.is_correct),
      selectionCount: (row.selection_count as number) || 0,
      selectionPercentage:
        totalAttempts > 0
          ? Math.round(((row.selection_count as number) / totalAttempts) * 100)
          : 0,
    }));

    console.log('✓ Statistics calculated, total attempts:', totalAttempts);

    return {
      questionId,
      totalAttempts,
      correctAttempts,
      successRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      averageTimeSeconds: stats?.avg_time ? Math.round(stats.avg_time as number) : null,
      optionDistribution,
    };
  }

  /**
   * Get all categories used by an instructor
   */
  static async getCategories(instructorId: string): Promise<string[]> {
    console.log('📂 Getting categories for instructor:', instructorId);

    const rows = await executeQuery<{ category: string }>(
      `SELECT DISTINCT category FROM questions 
       WHERE instructor_id = ? AND category IS NOT NULL
       ORDER BY category`,
      [instructorId]
    );

    const categories = rows.map((row) => row.category);
    console.log('✓ Found', categories.length, 'categories');
    return categories;
  }
}

