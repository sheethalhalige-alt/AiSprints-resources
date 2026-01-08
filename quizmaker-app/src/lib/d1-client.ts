/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * D1 Database Client
 * Provides helper functions for database operations with parameter binding normalization
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Get the D1 database instance from Cloudflare context
 */
export async function getDatabase(): Promise<D1Database> {
  try {
    const { env } = await getCloudflareContext();
    
    if (!env) {
      throw new Error('Environment is not available in request context');
    }
    
    const db = (env as any).quizmaker_app_database;
    
    if (!db) {
      console.error('Available env keys:', Object.keys(env || {}));
      throw new Error('D1 database binding "quizmaker_app_database" not found in environment');
    }
    
    return db;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database access error:', errorMsg);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    throw new Error(
      `Database access failed: ${errorMsg}. ` +
      'Ensure you are running with "npm run dev" or "npm run preview" in Cloudflare Workers mode.'
    );
  }
}

/**
 * Normalize SQL placeholders from ? to ?1, ?2, ?3, etc.
 * This fixes parameter binding issues in local development
 */
function normalizePlaceholders(sql: string): string {
  let counter = 0;
  return sql.replace(/\?/g, () => `?${++counter}`);
}

/**
 * Execute a SELECT query and return all results
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = await getDatabase();
  const normalizedSql = normalizePlaceholders(sql);
  
  console.log('🔍 Executing query:', normalizedSql.substring(0, 100));
  
  try {
    const stmt = db.prepare(normalizedSql);
    const result = await stmt.bind(...params).all();
    console.log('✓ Query executed successfully, rows:', result.results?.length || 0);
    return (result.results as T[]) || [];
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a SELECT query and return the first result
 */
export async function executeQueryFirst<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE mutation
 */
export async function executeMutation(
  sql: string,
  params: any[] = []
): Promise<{ success: boolean; meta: any }> {
  const db = await getDatabase();
  const normalizedSql = normalizePlaceholders(sql);
  
  console.log('💾 Executing mutation:', normalizedSql.substring(0, 100));
  
  try {
    const stmt = db.prepare(normalizedSql);
    const result = await stmt.bind(...params).run();
    console.log('✓ Mutation executed successfully');
    return {
      success: result.success || false,
      meta: result.meta,
    };
  } catch (error) {
    console.error('❌ Database mutation error:', error);
    throw new Error(`Database mutation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute multiple statements in a batch
 */
export async function executeBatch(
  statements: Array<{ sql: string; params: any[] }>
): Promise<any[]> {
  const db = await getDatabase();
  
  try {
    const preparedStatements = statements.map(({ sql, params }) => {
      const normalizedSql = normalizePlaceholders(sql);
      return db.prepare(normalizedSql).bind(...params);
    });
    
    const results = await db.batch(preparedStatements);
    return results;
  } catch (error) {
    console.error('Database batch error:', error);
    throw new Error(`Database batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique ID for database records
 * Uses crypto.randomUUID() for proper UUID generation
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Convert SQLite integer to boolean
 */
export function toBoolean(value: any): boolean {
  return value === 1 || value === true;
}

/**
 * Convert boolean to SQLite integer
 */
export function fromBoolean(value: boolean): number {
  return value ? 1 : 0;
}

