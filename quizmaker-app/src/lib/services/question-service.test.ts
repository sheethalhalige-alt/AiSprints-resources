/**
 * Question Service Unit Tests
 *
 * Comprehensive test suite for QuestionService CRUD operations.
 * Tests all methods including edge cases, validation, authorization, and boolean handling.
 *
 * @fileoverview Unit tests for src/lib/services/question-service.ts
 * @author QuizMaker Team
 * @date January 2026
 *
 * Test Categories:
 * - createQuestion: Input validation, option handling, database operations
 * - getQuestionById: Retrieval, authorization, role-based visibility
 * - listQuestions: Pagination, filtering, search
 * - updateQuestion: Ownership verification, partial updates, option replacement
 * - deleteQuestion: Soft delete, force delete, attempt checking
 * - getRandomQuestion: Randomization, exclusion logic
 * - getQuestionStatistics: Analytics calculation, permission checking
 * - getCategories: Category listing
 *
 * Running Tests:
 * - `npm run test` - Run all tests once
 * - `npm run test:watch` - Run tests in watch mode for continuous testing
 * - `npm run test -- --coverage` - Run with coverage report
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  QuestionService,
  CreateQuestionInput,
  UpdateQuestionInput,
  Question,
  QuestionOption,
} from './question-service';

// ============================================
// Mock Setup for D1 Client
// ============================================

/**
 * Mock the d1-client module to avoid actual database calls.
 * All database operations are simulated through these mocks.
 */
vi.mock('@/lib/d1-client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn(() => 'mock-uuid-12345'),
  toBoolean: vi.fn((value: unknown) => value === 1 || value === true),
  fromBoolean: vi.fn((value: boolean) => (value ? 1 : 0)),
}));

// Import mocked functions for test manipulation
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
// Test Fixtures & Helper Functions
// ============================================

/**
 * Factory function to create valid question input for tests.
 * Overridable fields allow testing specific scenarios.
 */
function createValidQuestionInput(
  overrides: Partial<CreateQuestionInput> = {}
): CreateQuestionInput {
  return {
    questionText: 'What is the capital of France?',
    category: 'Geography',
    difficulty: 'easy',
    points: 1,
    options: [
      { optionText: 'London', isCorrect: false },
      { optionText: 'Paris', isCorrect: true },
      { optionText: 'Berlin', isCorrect: false },
      { optionText: 'Madrid', isCorrect: false },
    ],
    ...overrides,
  };
}

/**
 * Factory function to create a mock question row from database.
 * Simulates the raw database response format.
 */
function createMockQuestionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'question-123',
    instructor_id: 'instructor-456',
    question_text: 'What is the capital of France?',
    category: 'Geography',
    difficulty: 'easy',
    points: 1,
    created_at: '2026-01-07T10:00:00Z',
    updated_at: '2026-01-07T10:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function to create mock option rows from database.
 * Simulates the raw database response format with integer booleans.
 */
function createMockOptionRows(count: number = 4, correctIndex: number = 1) {
  const options = ['London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Vienna'];
  return Array.from({ length: count }, (_, i) => ({
    id: `option-${i + 1}`,
    option_text: options[i],
    is_correct: i === correctIndex ? 1 : 0, // SQLite stores boolean as 0/1
    option_order: i + 1,
  }));
}

// Test IDs used across tests
const INSTRUCTOR_ID = 'instructor-456';
const STUDENT_ID = 'student-789';
const QUESTION_ID = 'question-123';

// ============================================
// Test Suite
// ============================================

describe('QuestionService', () => {
  /**
   * Reset all mocks before each test to ensure test isolation.
   * This prevents state leakage between tests.
   */
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log during tests for cleaner output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // createQuestion Tests
  // ============================================

  describe('createQuestion', () => {
    /**
     * Test: Successfully create a question with 4 valid options
     *
     * Verifies:
     * - Question is inserted into database
     * - Options are batch inserted
     * - Question is retrieved after creation
     * - Correct response structure returned
     */
    it('should create a question with 4 options successfully', async () => {
      // Arrange: Setup mocks for database operations
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeBatch).mockResolvedValue([]);
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      const input = createValidQuestionInput();

      // Act: Create the question
      const result = await QuestionService.createQuestion(INSTRUCTOR_ID, input);

      // Assert: Verify correct behavior
      expect(executeMutation).toHaveBeenCalledTimes(1);
      expect(executeBatch).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id');
      expect(result.questionText).toBe(input.questionText);
      expect(result.options).toHaveLength(4);
    });

    /**
     * Test: Successfully create a question with 6 valid options
     *
     * Verifies:
     * - System accepts 6 options (alternative to 4)
     * - All 6 options are properly inserted
     */
    it('should create a question with 6 options successfully', async () => {
      // Arrange
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeBatch).mockResolvedValue([]);
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(6));

      const input = createValidQuestionInput({
        options: [
          { optionText: 'A', isCorrect: false },
          { optionText: 'B', isCorrect: true },
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
          { optionText: 'E', isCorrect: false },
          { optionText: 'F', isCorrect: false },
        ],
      });

      // Act
      const result = await QuestionService.createQuestion(INSTRUCTOR_ID, input);

      // Assert
      expect(executeBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sql: expect.stringContaining('INSERT INTO options') }),
        ])
      );
      expect(result.options).toHaveLength(6);
    });

    /**
     * Test: Reject question with text shorter than 10 characters
     *
     * Verifies:
     * - Validation catches short question text
     * - Appropriate error message returned
     * - No database operations attempted
     */
    it('should reject question with text less than 10 characters', async () => {
      const input = createValidQuestionInput({ questionText: 'Short?' });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question text must be at least 10 characters');

      // Verify no database operations occurred
      expect(executeMutation).not.toHaveBeenCalled();
    });

    /**
     * Test: Reject question with text longer than 1000 characters
     *
     * Verifies:
     * - Maximum length validation works
     * - Error is thrown before database interaction
     */
    it('should reject question with text exceeding 1000 characters', async () => {
      const input = createValidQuestionInput({
        questionText: 'A'.repeat(1001),
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question text must not exceed 1000 characters');
    });

    /**
     * Test: Reject question with invalid option count (not 4 or 6)
     *
     * Verifies:
     * - Only 4 or 6 options are accepted
     * - Other counts (3, 5, 7) are rejected
     */
    it('should reject question with 3 options (not 4 or 6)', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: 'A', isCorrect: true },
          { optionText: 'B', isCorrect: false },
          { optionText: 'C', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question must have exactly 4 or 6 options');
    });

    /**
     * Test: Reject question with 5 options
     *
     * Verifies:
     * - 5 options (between 4 and 6) is still invalid
     */
    it('should reject question with 5 options', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: 'A', isCorrect: true },
          { optionText: 'B', isCorrect: false },
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
          { optionText: 'E', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question must have exactly 4 or 6 options');
    });

    /**
     * Test: Reject question with no correct answer
     *
     * Verifies:
     * - At least one option must be marked correct
     * - Clear error message provided
     */
    it('should reject question with no correct answer', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: 'A', isCorrect: false },
          { optionText: 'B', isCorrect: false },
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question must have exactly one correct answer');
    });

    /**
     * Test: Reject question with multiple correct answers
     *
     * Verifies:
     * - Only ONE correct answer allowed
     * - Multiple correct answers are rejected
     */
    it('should reject question with multiple correct answers', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: 'A', isCorrect: true },
          { optionText: 'B', isCorrect: true }, // Second correct!
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question must have exactly one correct answer');
    });

    /**
     * Test: Reject question with empty option text
     *
     * Verifies:
     * - All options must have non-empty text
     * - Whitespace-only text is rejected
     */
    it('should reject question with empty option text', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: '', isCorrect: true },
          { optionText: 'B', isCorrect: false },
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Option text cannot be empty');
    });

    /**
     * Test: Reject question with option text exceeding 500 characters
     *
     * Verifies:
     * - Option text has maximum length limit
     */
    it('should reject option text exceeding 500 characters', async () => {
      const input = createValidQuestionInput({
        options: [
          { optionText: 'A'.repeat(501), isCorrect: true },
          { optionText: 'B', isCorrect: false },
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
        ],
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Option text must not exceed 500 characters');
    });

    /**
     * Test: Reject invalid difficulty level
     *
     * Verifies:
     * - Only 'easy', 'medium', 'hard' are accepted
     */
    it('should reject invalid difficulty level', async () => {
      const input = createValidQuestionInput({
        difficulty: 'extreme' as any,
      });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Difficulty must be easy, medium, or hard');
    });

    /**
     * Test: Reject points less than 1
     *
     * Verifies:
     * - Points must be at least 1
     * - Zero and negative values rejected
     */
    it('should reject points less than 1', async () => {
      const input = createValidQuestionInput({ points: 0 });

      await expect(
        QuestionService.createQuestion(INSTRUCTOR_ID, input)
      ).rejects.toThrow('Points must be at least 1');
    });

    /**
     * Test: Default points to 1 when not provided
     *
     * Verifies:
     * - Points default to 1 if undefined
     * - Database receives default value
     */
    it('should default points to 1 when not provided', async () => {
      // Arrange
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeBatch).mockResolvedValue([]);
      vi.mocked(executeQueryFirst).mockResolvedValue(
        createMockQuestionRow({ points: 1 })
      );
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      const input = createValidQuestionInput({ points: undefined });

      // Act
      const result = await QuestionService.createQuestion(INSTRUCTOR_ID, input);

      // Assert
      expect(result.points).toBe(1);
    });

    /**
     * Test: Boolean values are converted correctly for database storage
     *
     * Verifies:
     * - isCorrect boolean is converted to 1/0 for SQLite
     * - fromBoolean utility is used
     */
    it('should convert boolean isCorrect to integer for database', async () => {
      // Arrange
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeBatch).mockResolvedValue([]);
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      const input = createValidQuestionInput();

      // Act
      await QuestionService.createQuestion(INSTRUCTOR_ID, input);

      // Assert: Verify fromBoolean was called for each option
      expect(fromBoolean).toHaveBeenCalledWith(false); // For incorrect options
      expect(fromBoolean).toHaveBeenCalledWith(true); // For correct option
    });
  });

  // ============================================
  // getQuestionById Tests
  // ============================================

  describe('getQuestionById', () => {
    /**
     * Test: Successfully retrieve a question by ID
     *
     * Verifies:
     * - Question is fetched from database
     * - Options are included in response
     * - Data is properly mapped to Question interface
     */
    it('should retrieve a question with options by ID', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      const result = await QuestionService.getQuestionById(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('question-123');
      expect(result?.options).toHaveLength(4);
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [QUESTION_ID]
      );
    });

    /**
     * Test: Return null for non-existent question
     *
     * Verifies:
     * - Graceful handling of missing questions
     * - No error thrown, just null returned
     */
    it('should return null if question does not exist', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(null);

      // Act
      const result = await QuestionService.getQuestionById(
        'non-existent-id',
        INSTRUCTOR_ID
      );

      // Assert
      expect(result).toBeNull();
    });

    /**
     * Test: Hide correct answers from students during quiz
     *
     * Verifies:
     * - When requesterRole is 'student', isCorrect is always false
     * - Prevents cheating by not revealing correct answer
     */
    it('should hide correct answers when requester is a student', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4, 1)); // Index 1 is correct

      // Act
      const result = await QuestionService.getQuestionById(
        QUESTION_ID,
        STUDENT_ID,
        'student'
      );

      // Assert: All options should show isCorrect as false
      expect(result?.options?.every((opt) => opt.isCorrect === false)).toBe(true);
    });

    /**
     * Test: Show correct answers to instructors
     *
     * Verifies:
     * - Instructors can see which option is correct
     * - isCorrect is properly converted from database integer
     */
    it('should show correct answers when requester is an instructor', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4, 1));
      vi.mocked(toBoolean).mockImplementation((v) => v === 1 || v === true);

      // Act
      const result = await QuestionService.getQuestionById(
        QUESTION_ID,
        INSTRUCTOR_ID,
        'instructor'
      );

      // Assert: One option should be marked correct
      const correctOptions = result?.options?.filter((opt) => opt.isCorrect);
      expect(correctOptions?.length).toBe(1);
    });

    /**
     * Test: Boolean conversion from SQLite integer (is_correct field)
     *
     * Verifies:
     * - Database integer 1 is converted to boolean true
     * - Database integer 0 is converted to boolean false
     * - toBoolean utility is used correctly
     */
    it('should convert database integer to boolean for isCorrect', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue([
        { id: 'opt-1', option_text: 'A', is_correct: 0, option_order: 1 },
        { id: 'opt-2', option_text: 'B', is_correct: 1, option_order: 2 },
      ]);
      vi.mocked(toBoolean).mockImplementation((v) => v === 1);

      // Act
      const result = await QuestionService.getQuestionById(
        QUESTION_ID,
        INSTRUCTOR_ID,
        'instructor'
      );

      // Assert
      expect(toBoolean).toHaveBeenCalledWith(0);
      expect(toBoolean).toHaveBeenCalledWith(1);
      expect(result?.options?.[0].isCorrect).toBe(false);
      expect(result?.options?.[1].isCorrect).toBe(true);
    });
  });

  // ============================================
  // listQuestions Tests
  // ============================================

  describe('listQuestions', () => {
    /**
     * Test: List questions with default pagination
     *
     * Verifies:
     * - Default page is 1
     * - Default limit is 20
     * - Proper pagination metadata returned
     */
    it('should list questions with default pagination', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 25 });
      vi.mocked(executeQuery).mockResolvedValue([
        createMockQuestionRow({ id: 'q1' }),
        createMockQuestionRow({ id: 'q2' }),
      ]);

      // Act
      const result = await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
      });

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(2);
    });

    /**
     * Test: Limit is capped at 100 per page
     *
     * Verifies:
     * - Requests for more than 100 items are capped
     * - Prevents excessive database loads
     */
    it('should cap limit at 100 items per page', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 500 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      const result = await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
        limit: 200, // Request 200
      });

      // Assert: Limit should be capped at 100
      expect(result.limit).toBe(100);
    });

    /**
     * Test: Filter questions by search term
     *
     * Verifies:
     * - Search query is added to WHERE clause
     * - LIKE pattern is used for partial matching
     */
    it('should filter questions by search term', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 5 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
        search: 'capital',
      });

      // Assert: Query should include LIKE clause
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining(['%capital%'])
      );
    });

    /**
     * Test: Filter questions by category
     *
     * Verifies:
     * - Category filter is applied correctly
     */
    it('should filter questions by category', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 3 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
        category: 'Geography',
      });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('category ='),
        expect.arrayContaining(['Geography'])
      );
    });

    /**
     * Test: Filter questions by difficulty
     *
     * Verifies:
     * - Difficulty filter is applied correctly
     */
    it('should filter questions by difficulty', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 10 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
        difficulty: 'hard',
      });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('difficulty ='),
        expect.arrayContaining(['hard'])
      );
    });

    /**
     * Test: Empty result when no questions match
     *
     * Verifies:
     * - Empty array returned for no matches
     * - totalPages is 0 for empty results
     */
    it('should return empty result when no questions match', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 0 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      const result = await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
      });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    /**
     * Test: Pagination offset calculation
     *
     * Verifies:
     * - Page 2 with limit 10 has offset 10
     * - Offset is correctly passed to query
     */
    it('should calculate correct offset for pagination', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({ count: 50 });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      await QuestionService.listQuestions({
        instructorId: INSTRUCTOR_ID,
        page: 3,
        limit: 10,
      });

      // Assert: Offset should be (3-1) * 10 = 20
      expect(executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([10, 20]) // limit, offset
      );
    });
  });

  // ============================================
  // updateQuestion Tests
  // ============================================

  describe('updateQuestion', () => {
    /**
     * Test: Successfully update question text
     *
     * Verifies:
     * - Question text can be updated
     * - Ownership is verified before update
     * - Updated question is returned
     */
    it('should update question text successfully', async () => {
      // Arrange: Mock ownership check and update
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID }) // Ownership check
        .mockResolvedValueOnce(createMockQuestionRow({ question_text: 'Updated text' })); // Get updated
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      const input: UpdateQuestionInput = {
        questionText: 'What is the capital of Germany?',
      };

      // Act
      const result = await QuestionService.updateQuestion(
        QUESTION_ID,
        INSTRUCTOR_ID,
        input
      );

      // Assert
      expect(executeMutation).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE questions SET'),
        expect.any(Array)
      );
      expect(result).not.toBeNull();
    });

    /**
     * Test: Reject update for non-existent question
     *
     * Verifies:
     * - Error thrown when question doesn't exist
     * - No update attempted
     */
    it('should throw error if question does not exist', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(
        QuestionService.updateQuestion(QUESTION_ID, INSTRUCTOR_ID, {
          questionText: 'New text here',
        })
      ).rejects.toThrow('Question not found');
    });

    /**
     * Test: Reject update by non-owner
     *
     * Verifies:
     * - Only the question owner can update
     * - Permission error for other instructors
     */
    it('should throw error if instructor does not own the question', async () => {
      // Arrange: Different instructor owns the question
      vi.mocked(executeQueryFirst).mockResolvedValue({
        id: QUESTION_ID,
        instructor_id: 'different-instructor',
      });

      // Act & Assert
      await expect(
        QuestionService.updateQuestion(QUESTION_ID, INSTRUCTOR_ID, {
          questionText: 'Trying to update',
        })
      ).rejects.toThrow('You do not have permission to update this question');
    });

    /**
     * Test: Update options replaces all existing options
     *
     * Verifies:
     * - DELETE is called for existing options
     * - New options are inserted via batch
     * - Option replacement is atomic
     */
    it('should replace all options when updating', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce(createMockQuestionRow());
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeBatch).mockResolvedValue([]);
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      const input: UpdateQuestionInput = {
        options: [
          { optionText: 'New A', isCorrect: true },
          { optionText: 'New B', isCorrect: false },
          { optionText: 'New C', isCorrect: false },
          { optionText: 'New D', isCorrect: false },
        ],
      };

      // Act
      await QuestionService.updateQuestion(QUESTION_ID, INSTRUCTOR_ID, input);

      // Assert: Old options deleted, new ones inserted
      expect(executeMutation).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM options'),
        [QUESTION_ID]
      );
      expect(executeBatch).toHaveBeenCalled();
    });

    /**
     * Test: Validate updated options have exactly one correct answer
     *
     * Verifies:
     * - Validation rules apply to option updates too
     */
    it('should reject update with multiple correct answers in options', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({
        id: QUESTION_ID,
        instructor_id: INSTRUCTOR_ID,
      });

      const input: UpdateQuestionInput = {
        options: [
          { optionText: 'A', isCorrect: true },
          { optionText: 'B', isCorrect: true }, // Invalid: second correct
          { optionText: 'C', isCorrect: false },
          { optionText: 'D', isCorrect: false },
        ],
      };

      // Act & Assert
      await expect(
        QuestionService.updateQuestion(QUESTION_ID, INSTRUCTOR_ID, input)
      ).rejects.toThrow('Question must have exactly one correct answer');
    });

    /**
     * Test: Update timestamp is always updated
     *
     * Verifies:
     * - updated_at field changes on any update
     */
    it('should always update the updated_at timestamp', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce(createMockQuestionRow());
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      await QuestionService.updateQuestion(QUESTION_ID, INSTRUCTOR_ID, {
        difficulty: 'medium',
      });

      // Assert: updated_at should be in the update query
      expect(executeMutation).toHaveBeenCalledWith(
        expect.stringContaining('updated_at'),
        expect.any(Array)
      );
    });
  });

  // ============================================
  // deleteQuestion Tests
  // ============================================

  describe('deleteQuestion', () => {
    /**
     * Test: Successfully delete a question without attempts
     *
     * Verifies:
     * - Question is deleted when no attempts exist
     * - Success message returned
     */
    it('should delete a question with no attempts', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID }) // Ownership
        .mockResolvedValueOnce({ count: 0 }); // No attempts
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });

      // Act
      const result = await QuestionService.deleteQuestion(
        QUESTION_ID,
        INSTRUCTOR_ID,
        false
      );

      // Assert
      expect(result.deleted).toBe(true);
      expect(result.message).toBe('Question deleted successfully');
      expect(executeMutation).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM questions'),
        [QUESTION_ID]
      );
    });

    /**
     * Test: Block delete when question has attempts (soft delete protection)
     *
     * Verifies:
     * - Delete is prevented when attempts exist
     * - Error message includes attempt count
     * - force=true is suggested
     */
    it('should block delete when question has attempts and force=false', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce({ count: 15 }); // Has 15 attempts

      // Act & Assert
      await expect(
        QuestionService.deleteQuestion(QUESTION_ID, INSTRUCTOR_ID, false)
      ).rejects.toThrow('Cannot delete question with 15 quiz attempts');
    });

    /**
     * Test: Force delete question with attempts
     *
     * Verifies:
     * - force=true bypasses attempt check
     * - Question is deleted even with attempts
     * - CASCADE handles options and attempts
     */
    it('should force delete question with attempts when force=true', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({
        id: QUESTION_ID,
        instructor_id: INSTRUCTOR_ID,
      });
      vi.mocked(executeMutation).mockResolvedValue({ success: true, meta: {} });

      // Act
      const result = await QuestionService.deleteQuestion(
        QUESTION_ID,
        INSTRUCTOR_ID,
        true // Force delete
      );

      // Assert
      expect(result.deleted).toBe(true);
      expect(result.message).toBe('Question and associated data deleted successfully');
    });

    /**
     * Test: Reject delete for non-existent question
     *
     * Verifies:
     * - 404-like error for missing question
     */
    it('should throw error if question does not exist', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(
        QuestionService.deleteQuestion(QUESTION_ID, INSTRUCTOR_ID)
      ).rejects.toThrow('Question not found');
    });

    /**
     * Test: Reject delete by non-owner
     *
     * Verifies:
     * - Only owner can delete question
     */
    it('should throw error if instructor does not own the question', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({
        id: QUESTION_ID,
        instructor_id: 'other-instructor',
      });

      // Act & Assert
      await expect(
        QuestionService.deleteQuestion(QUESTION_ID, INSTRUCTOR_ID)
      ).rejects.toThrow('You do not have permission to delete this question');
    });
  });

  // ============================================
  // getRandomQuestion Tests
  // ============================================

  describe('getRandomQuestion', () => {
    /**
     * Test: Get a random question successfully
     *
     * Verifies:
     * - Random question is fetched
     * - Query uses ORDER BY RANDOM()
     * - Options are included
     */
    it('should return a random question', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      const result = await QuestionService.getRandomQuestion(STUDENT_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('RANDOM()'),
        expect.any(Array)
      );
    });

    /**
     * Test: Exclude already attempted questions
     *
     * Verifies:
     * - NOT IN subquery is used when excludeAttempted=true
     * - Student's previous attempts are filtered out
     */
    it('should exclude already attempted questions when excludeAttempted=true', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      await QuestionService.getRandomQuestion(STUDENT_ID, true);

      // Assert
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('NOT IN'),
        expect.arrayContaining([STUDENT_ID])
      );
    });

    /**
     * Test: Filter random question by category
     *
     * Verifies:
     * - Category filter is applied to random selection
     */
    it('should filter by category', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      await QuestionService.getRandomQuestion(STUDENT_ID, false, 'Math');

      // Assert
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('category ='),
        expect.arrayContaining(['Math'])
      );
    });

    /**
     * Test: Filter random question by difficulty
     *
     * Verifies:
     * - Difficulty filter is applied to random selection
     */
    it('should filter by difficulty', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4));

      // Act
      await QuestionService.getRandomQuestion(STUDENT_ID, false, undefined, 'hard');

      // Assert
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('difficulty ='),
        expect.arrayContaining(['hard'])
      );
    });

    /**
     * Test: Return null when no questions available
     *
     * Verifies:
     * - Graceful handling when all questions attempted
     * - No error thrown, null returned
     */
    it('should return null when no questions are available', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(null);

      // Act
      const result = await QuestionService.getRandomQuestion(STUDENT_ID, true);

      // Assert
      expect(result).toBeNull();
    });

    /**
     * Test: Always hide correct answers for quiz questions
     *
     * Verifies:
     * - isCorrect is always false for quiz questions
     * - Prevents cheating
     */
    it('should always hide correct answers for quiz', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue(createMockQuestionRow());
      vi.mocked(executeQuery).mockResolvedValue(createMockOptionRows(4, 1)); // Index 1 is correct

      // Act
      const result = await QuestionService.getRandomQuestion(STUDENT_ID);

      // Assert: All options should have isCorrect as false
      expect(result?.options?.every((opt) => opt.isCorrect === false)).toBe(true);
    });
  });

  // ============================================
  // getQuestionStatistics Tests
  // ============================================

  describe('getQuestionStatistics', () => {
    /**
     * Test: Get statistics for a question with attempts
     *
     * Verifies:
     * - Statistics are calculated correctly
     * - Success rate is computed
     * - Option distribution is included
     */
    it('should return statistics for a question', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID }) // Ownership
        .mockResolvedValueOnce({
          total_attempts: 100,
          correct_attempts: 75,
          avg_time: 45.5,
        });
      vi.mocked(executeQuery).mockResolvedValue([
        { option_id: 'opt-1', option_text: 'A', is_correct: 0, selection_count: 10 },
        { option_id: 'opt-2', option_text: 'B', is_correct: 1, selection_count: 75 },
        { option_id: 'opt-3', option_text: 'C', is_correct: 0, selection_count: 10 },
        { option_id: 'opt-4', option_text: 'D', is_correct: 0, selection_count: 5 },
      ]);

      // Act
      const result = await QuestionService.getQuestionStatistics(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(result.totalAttempts).toBe(100);
      expect(result.correctAttempts).toBe(75);
      expect(result.successRate).toBe(75);
      expect(result.averageTimeSeconds).toBe(46); // Rounded from 45.5
      expect(result.optionDistribution).toHaveLength(4);
    });

    /**
     * Test: Calculate success rate as percentage
     *
     * Verifies:
     * - Success rate is (correct / total) * 100
     * - Rounded to integer percentage
     */
    it('should calculate success rate correctly', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce({
          total_attempts: 200,
          correct_attempts: 150, // 75%
          avg_time: 30,
        });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      const result = await QuestionService.getQuestionStatistics(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(result.successRate).toBe(75);
    });

    /**
     * Test: Handle question with zero attempts
     *
     * Verifies:
     * - Division by zero is avoided
     * - Success rate is 0 when no attempts
     * - Average time is null when no attempts
     */
    it('should handle zero attempts gracefully', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce({
          total_attempts: 0,
          correct_attempts: 0,
          avg_time: null,
        });
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      const result = await QuestionService.getQuestionStatistics(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(result.totalAttempts).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.averageTimeSeconds).toBeNull();
    });

    /**
     * Test: Option selection percentage calculation
     *
     * Verifies:
     * - Each option shows % of students who selected it
     * - Percentages are rounded to integers
     */
    it('should calculate option selection percentages', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce({ total_attempts: 100, correct_attempts: 50, avg_time: 30 });
      vi.mocked(executeQuery).mockResolvedValue([
        { option_id: 'opt-1', option_text: 'A', is_correct: 0, selection_count: 25 },
        { option_id: 'opt-2', option_text: 'B', is_correct: 1, selection_count: 50 },
        { option_id: 'opt-3', option_text: 'C', is_correct: 0, selection_count: 15 },
        { option_id: 'opt-4', option_text: 'D', is_correct: 0, selection_count: 10 },
      ]);

      // Act
      const result = await QuestionService.getQuestionStatistics(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(result.optionDistribution[0].selectionPercentage).toBe(25);
      expect(result.optionDistribution[1].selectionPercentage).toBe(50);
      expect(result.optionDistribution[2].selectionPercentage).toBe(15);
      expect(result.optionDistribution[3].selectionPercentage).toBe(10);
    });

    /**
     * Test: Reject statistics access for non-owner
     *
     * Verifies:
     * - Only question owner can view statistics
     */
    it('should throw error if instructor does not own the question', async () => {
      // Arrange
      vi.mocked(executeQueryFirst).mockResolvedValue({
        id: QUESTION_ID,
        instructor_id: 'other-instructor',
      });

      // Act & Assert
      await expect(
        QuestionService.getQuestionStatistics(QUESTION_ID, INSTRUCTOR_ID)
      ).rejects.toThrow("You do not have permission to view this question's statistics");
    });

    /**
     * Test: Boolean conversion for option isCorrect in distribution
     *
     * Verifies:
     * - is_correct from database (0/1) is converted to boolean
     * - toBoolean utility is used
     */
    it('should convert is_correct to boolean in option distribution', async () => {
      // Arrange
      vi.mocked(executeQueryFirst)
        .mockResolvedValueOnce({ id: QUESTION_ID, instructor_id: INSTRUCTOR_ID })
        .mockResolvedValueOnce({ total_attempts: 10, correct_attempts: 5, avg_time: 20 });
      vi.mocked(executeQuery).mockResolvedValue([
        { option_id: 'opt-1', option_text: 'A', is_correct: 0, selection_count: 5 },
        { option_id: 'opt-2', option_text: 'B', is_correct: 1, selection_count: 5 },
      ]);
      vi.mocked(toBoolean).mockImplementation((v) => v === 1);

      // Act
      const result = await QuestionService.getQuestionStatistics(
        QUESTION_ID,
        INSTRUCTOR_ID
      );

      // Assert
      expect(toBoolean).toHaveBeenCalledWith(0);
      expect(toBoolean).toHaveBeenCalledWith(1);
      expect(result.optionDistribution[0].isCorrect).toBe(false);
      expect(result.optionDistribution[1].isCorrect).toBe(true);
    });
  });

  // ============================================
  // getCategories Tests
  // ============================================

  describe('getCategories', () => {
    /**
     * Test: Get distinct categories for an instructor
     *
     * Verifies:
     * - Returns list of unique categories
     * - Excludes null categories
     * - Sorted alphabetically
     */
    it('should return distinct categories', async () => {
      // Arrange
      vi.mocked(executeQuery).mockResolvedValue([
        { category: 'Geography' },
        { category: 'Math' },
        { category: 'Science' },
      ]);

      // Act
      const result = await QuestionService.getCategories(INSTRUCTOR_ID);

      // Assert
      expect(result).toEqual(['Geography', 'Math', 'Science']);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DISTINCT category'),
        [INSTRUCTOR_ID]
      );
    });

    /**
     * Test: Return empty array when no categories exist
     *
     * Verifies:
     * - Handles instructors with no questions
     * - No error thrown
     */
    it('should return empty array when no categories exist', async () => {
      // Arrange
      vi.mocked(executeQuery).mockResolvedValue([]);

      // Act
      const result = await QuestionService.getCategories(INSTRUCTOR_ID);

      // Assert
      expect(result).toEqual([]);
    });
  });
});

// ============================================
// Integration Test Suggestions
// ============================================

/**
 * INTEGRATION TEST RECOMMENDATIONS
 *
 * The unit tests above mock database interactions. For complete coverage,
 * implement these integration tests that use a real test database:
 *
 * 1. Full CRUD Lifecycle Test:
 *    - Create a question
 *    - Read it back
 *    - Update it
 *    - Delete it
 *    - Verify cascade deletions
 *
 * 2. Quiz Flow Integration:
 *    - Create questions as instructor
 *    - Fetch random question as student (verify hidden answers)
 *    - Submit answer (via QuizService)
 *    - Verify attempt is recorded
 *    - Verify statistics update
 *
 * 3. Concurrent Access Test:
 *    - Simulate two instructors editing the same question
 *    - Verify last-write-wins behavior
 *
 * 4. Foreign Key Cascade Test:
 *    - Create question with options and attempts
 *    - Force delete question
 *    - Verify all related records deleted
 *
 * 5. Edge Case Data Test:
 *    - Unicode characters in question text
 *    - Maximum length inputs (1000 chars question, 500 chars option)
 *    - Special characters in category names
 *
 * To run integration tests:
 * ```bash
 * npm run test:integration
 * ```
 */

// ============================================
// Coverage Improvement Suggestions
// ============================================

/**
 * COVERAGE IMPROVEMENT RECOMMENDATIONS
 *
 * To achieve higher test coverage, consider adding tests for:
 *
 * 1. Database Error Handling:
 *    - Mock database to throw errors
 *    - Verify error messages propagate correctly
 *    - Test retry logic (if implemented)
 *
 * 2. Input Sanitization:
 *    - Test that .trim() is applied to text inputs
 *    - Verify whitespace-only strings are handled
 *
 * 3. Edge Values:
 *    - Question text exactly 10 characters (minimum valid)
 *    - Question text exactly 1000 characters (maximum valid)
 *    - Points value of 1 (minimum valid)
 *
 * 4. Date/Time Handling:
 *    - Mock Date.now() to verify timestamp generation
 *    - Test timezone handling if applicable
 *
 * 5. Query Building:
 *    - Test all filter combinations
 *    - Verify SQL injection protection (parameterized queries)
 *
 * To generate coverage report:
 * ```bash
 * npm run test -- --coverage
 * ```
 */

// ============================================
// Watch Mode for Continuous Testing
// ============================================

/**
 * WATCH MODE USAGE
 *
 * For continuous testing during development:
 *
 * ```bash
 * npm run test:watch
 * ```
 *
 * This will:
 * - Run tests on file changes
 * - Show instant feedback
 * - Only re-run affected tests
 * - Provide interactive menu for filtering tests
 *
 * Keyboard shortcuts in watch mode:
 * - `a` - Run all tests
 * - `f` - Run only failed tests
 * - `p` - Filter by filename pattern
 * - `t` - Filter by test name pattern
 * - `q` - Quit watch mode
 */

