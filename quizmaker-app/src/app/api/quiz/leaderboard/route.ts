import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireAuth } from '@/lib/auth-utils';

/**
 * GET /api/quiz/leaderboard
 * Get the leaderboard of top students
 * Query params:
 *   - limit: number (default 10, max 100)
 * 
 * Note: This endpoint is accessible by both students and instructors
 */
export async function GET(request: NextRequest) {
  try {
    // Both students and instructors can view the leaderboard
    requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const leaderboard = await QuizService.getLeaderboard(limit);

    return NextResponse.json(
      {
        success: true,
        leaderboard,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get leaderboard';
    const status = errorMessage.includes('authenticated') ? 401 : 400;

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status }
    );
  }
}

