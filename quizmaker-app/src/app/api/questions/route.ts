import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/questions
 * List questions for the authenticated instructor (paginated, searchable, filterable)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'instructor');

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;

    const result = await QuestionService.listQuestions({
      instructorId: user.userId,
      page,
      limit,
      search,
      category,
      difficulty,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list questions';
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

