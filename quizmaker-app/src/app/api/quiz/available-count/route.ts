import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/quiz/available-count
 * Get count of available questions for the student
 * Query params:
 *   - excludeAttempted: boolean (default false)
 *   - category: string
 *   - difficulty: 'easy' | 'medium' | 'hard'
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'student');

    const searchParams = request.nextUrl.searchParams;
    const excludeAttempted = searchParams.get('excludeAttempted') === 'true';
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;

    const count = await QuizService.getAvailableQuestionCount(
      user.userId,
      excludeAttempted,
      category,
      difficulty
    );

    return NextResponse.json(
      {
        success: true,
        count,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get count';
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

