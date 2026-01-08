import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignupBody;
    const { name, email, password, role } = body;

    console.log('📝 Signup request received:', { 
      name, 
      email, 
      role,
      hasPassword: !!password 
    });

    const result = await AuthService.register({
      name,
      email,
      password,
      role,
    });

    console.log('✅ User registered successfully:', result.userId);

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        userId: result.userId,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Signup error:', errorMessage);
    console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 400 }
    );
  }
}
