/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/d1-client';

/**
 * GET /api/data
 * Fetch data from Cloudflare D1 database and return as JSON
 * 
 * Query Parameters:
 * - table: The table to query (users, questions, options, quiz_attempts)
 * - limit: Max number of rows (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Allowed tables for security
    const allowedTables = ['users', 'questions', 'options', 'quiz_attempts'];
    
    if (table) {
      // Fetch data from specific table
      if (!allowedTables.includes(table)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid table. Allowed tables: ${allowedTables.join(', ')}`,
          },
          { status: 400 }
        );
      }
      
      const result = await db.prepare(`SELECT * FROM ${table} LIMIT ?1`).bind(limit).all();
      
      // If fetching users, remove password field for security
      let data = result.results || [];
      if (table === 'users') {
        data = data.map((user: any) => {
          const { password, ...safeUser } = user;
          return safeUser;
        });
      }
      
      return NextResponse.json(
        {
          success: true,
          table,
          count: data.length,
          data,
        },
        { status: 200 }
      );
    }
    
    // If no table specified, return summary of all tables
    const summary: Record<string, any> = {};
    
    for (const tableName of allowedTables) {
      const countResult = await db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first<{ count: number }>();
      summary[tableName] = {
        rowCount: countResult?.count || 0,
      };
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Database summary. Use ?table=<tablename> to fetch specific table data.',
        tables: summary,
        availableTables: allowedTables,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch data from database',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}




