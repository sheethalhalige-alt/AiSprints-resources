/**
 * Authentication Utilities
 * Helper functions for extracting user info from request headers
 * (set by middleware after token verification)
 */

import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  userId: string;
  role: 'student' | 'instructor';
}

/**
 * Get authenticated user info from request headers
 * Headers are set by middleware after verifying the JWT token
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as 'student' | 'instructor' | null;

  if (!userId || !role) {
    return null;
  }

  return { userId, role };
}

/**
 * Require authenticated user, throw if not authenticated
 */
export function requireAuth(request: NextRequest): AuthenticatedUser {
  const user = getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

/**
 * Require specific role, throw if not authorized
 */
export function requireRole(
  request: NextRequest,
  requiredRole: 'student' | 'instructor'
): AuthenticatedUser {
  const user = requireAuth(request);
  if (user.role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }
  return user;
}

