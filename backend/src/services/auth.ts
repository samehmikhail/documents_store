import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/database';
import { Config } from '../config';
import { User, UserRole, AuthToken, LoginRequest, RegisterRequest } from '../types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthToken | null> {
    const user = database.getUserByUsername(credentials.username);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      Config.JWT_SECRET as string,
      { expiresIn: Config.JWT_EXPIRES_IN as string }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    database.storeUserToken(user.id, token);

    return {
      token,
      expiresAt
    };
  }

  async register(userData: RegisterRequest): Promise<User | null> {
    // Check if username already exists
    const existingUserByUsername = database.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      return null;
    }

    // Check if email already exists
    const existingUserByEmail = database.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return null;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return database.createUser(newUser);
  }

  logout(userId: string): boolean {
    return database.removeUserToken(userId);
  }

  validateToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, Config.JWT_SECRET as string) as any;
      return database.getUserById(decoded.userId) || null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();