/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import { hash, compare } from '@/lib/crypto-edge';
import { signToken, verifyToken } from '@/lib/jwt-edge';
import { executeQueryFirst, executeMutation, generateId } from '@/lib/d1-client';

const JWT_EXPIRES_IN = '24h';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: CreateUserInput): Promise<{ userId: string }> {
    console.log('🔍 Starting registration process...');
    
    // Validate input
    if (!input.name || input.name.length < 2 || input.name.length > 100) {
      throw new Error('Name must be between 2 and 100 characters');
    }
    
    if (!input.email || !this.isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    if (!['student', 'instructor'].includes(input.role)) {
      throw new Error('Invalid role');
    }

    console.log('✓ Input validation passed');

    // Check if email already exists
    console.log('🔍 Checking if email exists...');
    const existingUser = await executeQueryFirst(
      'SELECT id FROM users WHERE email = ?',
      [input.email.toLowerCase()]
    );
    
    if (existingUser) {
      throw new Error('Email already exists');
    }

    console.log('✓ Email is unique');

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await hash(input.password);
    console.log('✓ Password hashed');

    // Generate user ID
    const userId = generateId();
    console.log('✓ User ID generated:', userId);

    // Insert user into database
    console.log('💾 Inserting user into database...');
    await executeMutation(
      `INSERT INTO users (id, name, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, input.name, input.email.toLowerCase(), hashedPassword, input.role]
    );

    console.log('✅ User successfully inserted into database');

    return { userId };
  }

  /**
   * Login user and generate JWT token
   */
  static async login(input: LoginInput): Promise<{ token: string; user: User }> {
    if (!input.email || !input.password) {
      throw new Error('Email and password are required');
    }

    console.log('🔐 Login attempt for:', input.email);

    // Fetch user from database
    const userRow = await executeQueryFirst<any>(
      'SELECT id, name, email, password, role, created_at FROM users WHERE email = ?',
      [input.email.toLowerCase()]
    );

    if (!userRow) {
      console.log('❌ User not found');
      throw new Error('Invalid email or password');
    }

    console.log('✓ User found:', userRow.email);

    // Verify password
    const isPasswordValid = await compare(input.password, userRow.password as string);
    
    console.log('🔒 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch');
      throw new Error('Invalid email or password');
    }
    
    console.log('✓ Password verified successfully');

    // Generate JWT token
    const token = await signToken(
      {
        userId: userRow.id as string,
        email: userRow.email as string,
        role: userRow.role as string,
      },
      JWT_EXPIRES_IN
    );

    // Return user info (without password)
    const user: User = {
      id: userRow.id as string,
      name: userRow.name as string,
      email: userRow.email as string,
      role: userRow.role as 'student' | 'instructor',
      createdAt: userRow.created_at as string,
    };

    return { token, user };
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<JWTPayload> {
    return await verifyToken(token);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const userRow = await executeQueryFirst<any>(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!userRow) {
      return null;
    }

    return {
      id: userRow.id as string,
      name: userRow.name as string,
      email: userRow.email as string,
      role: userRow.role as 'student' | 'instructor',
      createdAt: userRow.created_at as string,
    };
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

