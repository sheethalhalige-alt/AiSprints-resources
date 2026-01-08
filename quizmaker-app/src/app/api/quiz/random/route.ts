import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/quiz/random
 * Get a random question for the student to answer
 * Query params:
 *   - excludeAttempted: boolean (default false) - exclude already attempted questions
 *   - category: string - filter by category
 *   - difficulty: 'easy' | 'medium' | 'hard' - filter by difficulty
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'student');

    const searchParams = request.nextUrl.searchParams;
    const excludeAttempted = searchParams.get('excludeAttempted') === 'true';
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;

    const question = await QuestionService.getRandomQuestion(
      user.userId,
      excludeAttempted,
      category,
      difficulty
    );

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: 'No questions available',
          noQuestions: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        question,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get question';
    const status = errorMessage.includes('permission') || errorMessage.includes('role') ? 403 : 400;

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status }
    );
  }
}

