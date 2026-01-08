import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/quiz/statistics
 * Get comprehensive statistics for the authenticated student
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'student');

    const statistics = await QuizService.getStudentStatistics(user.userId);

    return NextResponse.json(
      {
        success: true,
        statistics,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get statistics';
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

