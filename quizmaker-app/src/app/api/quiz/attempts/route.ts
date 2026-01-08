import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/quiz/attempts
 * Get the authenticated student's attempt history (paginated)
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'student');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await QuizService.getStudentAttempts(user.userId, page, limit);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get attempts';
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

