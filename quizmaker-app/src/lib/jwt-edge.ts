/**
 * Edge-compatible JWT utilities using Web Crypto API
 * This works in Edge Runtime (Cloudflare Workers, Vercel Edge, etc.)
 */

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create HMAC signature using Web Crypto API
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    algorithm,
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    algorithm.name,
    key,
    encoder.encode(data)
  );
  
  const signatureArray = new Uint8Array(signature);
  const signatureHex = uint8ArrayToHex(signatureArray);
  return base64UrlEncode(signatureHex);
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Parse expiresIn (simplified - only handles "24h", "7d", etc.)
  let expirationSeconds = 86400; // default 24 hours
  if (expiresIn.endsWith('h')) {
    expirationSeconds = parseInt(expiresIn) * 3600;
  } else if (expiresIn.endsWith('d')) {
    expirationSeconds = parseInt(expiresIn) * 86400;
  }
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expirationSeconds,
  };
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(data, JWT_SECRET);
  
  return `${data}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await createSignature(data, JWT_SECRET);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    // Decode payload
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

