/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    
    // Check if database is available
    const db = (env as any).quizmaker_app_database;
    
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database binding not found',
          availableBindings: Object.keys(env || {}),
        },
        { status: 500 }
      );
    }

    // Try a simple query
    const result = await db.prepare('SELECT 1 as test').first();
    
    // Get table count
    const tables = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();

    return NextResponse.json(
      {
        success: true,
        message: 'Database connection successful',
        database: {
          connected: true,
          testQuery: result,
          tableCount: tables.results?.length || 0,
          tables: tables.results?.map((t: any) => t.name) || [],
        },
        environment: {
          runtime: 'cloudflare-workers',
          hasJWT: !!process.env.JWT_SECRET,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

