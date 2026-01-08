import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireRole } from '@/lib/auth-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quiz/attempts/[id]
 * Get a specific attempt with full details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = requireRole(request, 'student');
    const { id } = await context.params;

    const attempt = await QuizService.getAttemptById(id, user.userId);

    if (!attempt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Attempt not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        attempt,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get attempt';
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

