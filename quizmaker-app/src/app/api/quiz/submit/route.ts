import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * POST /api/quiz/submit
 * Submit an answer for a question
 * Body:
 *   - questionId: string
 *   - selectedOptionId: string
 *   - timeTakenSeconds: number (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, 'student');
    const body = await request.json();

    const { questionId, selectedOptionId, timeTakenSeconds } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question ID and selected option are required',
        },
        { status: 400 }
      );
    }

    const result = await QuizService.submitAnswer(user.userId, {
      questionId,
      selectedOptionId,
      timeTakenSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.isCorrect ? 'Correct answer!' : 'Incorrect answer',
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
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

