/**
 * Cloudflare Environment Types
 * Defines the structure of the Cloudflare Workers environment
 */

export interface CloudflareEnv {
  quizmaker_app_database: D1Database;
  JWT_SECRET?: string;
}

