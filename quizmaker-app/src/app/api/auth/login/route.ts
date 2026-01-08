import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await AuthService.login({ email, password });

    // Set token as HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user,
      },
      { status: 200 }
    );

    // Set cookie with JWT token (HTTP-only for security)
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    const status = errorMessage.includes('Invalid') ? 401 : 400;
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status }
    );
  }
}

