import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/question-service';
import { requireRole } from '@/lib/auth-utils';

/**
 * GET /api/questions/categories
 * Get all categories for the authenticated instructor
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'instructor');

    const categories = await QuestionService.getCategories(user.userId);

    return NextResponse.json(
      {
        success: true,
        categories,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get categories';
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

