import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questions/[id]/statistics
 * Get statistics for a specific question (instructor only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = requireRole(request, 'instructor');
    const { id } = await context.params;

    const statistics = await QuestionService.getQuestionStatistics(id, user.userId);

    return NextResponse.json(
      {
        success: true,
        statistics,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get statistics';
    let status = 400;
    if (errorMessage.includes('permission') || errorMessage.includes('role')) {
      status = 403;
    } else if (errorMessage.includes('not found')) {
      status = 404;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status }
    );
  }
}

