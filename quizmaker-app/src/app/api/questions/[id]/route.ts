import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questions/[id]
 * Get a specific question by ID (instructor only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = requireRole(request, 'instructor');
    const { id } = await context.params;

    const question = await QuestionService.getQuestionById(id, user.userId, 'instructor');

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question not found',
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (question.instructorId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to view this question',
        },
        { status: 403 }
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

/**
 * PUT /api/questions/[id]
 * Update a question (instructor only)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = requireRole(request, 'instructor');
    const { id } = await context.params;
    const body = await request.json();

    const { questionText, category, difficulty, points, options } = body;

    const question = await QuestionService.updateQuestion(id, user.userId, {
      questionText,
      category,
      difficulty,
      points,
      options,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Question updated successfully',
        question,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update question';
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

/**
 * DELETE /api/questions/[id]
 * Delete a question (instructor only)
 * Query param: ?force=true to force delete with attempts
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = requireRole(request, 'instructor');
    const { id } = await context.params;

    const force = request.nextUrl.searchParams.get('force') === 'true';

    const result = await QuestionService.deleteQuestion(id, user.userId, force);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete question';
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

