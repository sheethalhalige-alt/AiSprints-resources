/**
 * Simple password hashing for demo/learning purposes
 * Uses Web Crypto API SHA-256 (works in edge runtime)
 * 
 * NOTE: For production, use a proper password hashing library like bcrypt or argon2
 */

/**
 * Hash a password using SHA-256
 */
export async function hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare a password with a stored hash
 */
export async function compare(password: string, storedHash: string): Promise<boolean> {
  const hashedPassword = await hash(password);
  return hashedPassword === storedHash;
}
