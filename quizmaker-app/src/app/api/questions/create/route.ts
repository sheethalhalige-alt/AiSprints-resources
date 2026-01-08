import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * POST /api/questions/create
 * Create a new question (instructor only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, 'instructor');
    const body = await request.json();

    const { questionText, category, difficulty, points, options } = body;

    const question = await QuestionService.createQuestion(user.userId, {
      questionText,
      category,
      difficulty,
      points,
      options,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Question created successfully',
        question,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create question';
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

