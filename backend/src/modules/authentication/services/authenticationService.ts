import { IDatabase } from '../../../database/interfaces';
import { User, Token, UserWithToken } from '../types/user';
import { UserRepository } from '../repositories/userRepository';
import { TokenRepository } from '../repositories/tokenRepository';
import { v4 as uuidv4 } from 'uuid';

export class AuthenticationService {
  private userRepository: UserRepository;
  private tokenRepository: TokenRepository;

  constructor(database: IDatabase) {
    this.userRepository = new UserRepository(database);
    this.tokenRepository = new TokenRepository(database);
  }

  async findUserByToken(token: string): Promise<UserWithToken | undefined> {
    try {
      const tokenRecord = await this.tokenRepository.findByToken(token);
      if (!tokenRecord) {
        return undefined;
      }

      const user = await this.userRepository.findById(tokenRecord.userId);
      if (!user) {
        return undefined;
      }

      return {
        ...user,
        token: tokenRecord
      };
    } catch (error) {
      console.error('Error finding user by token:', error);
      return undefined;
    }
  }

  async createUser(username: string, role: 'admin' | 'user' = 'user', defaultToken?: string): Promise<UserWithToken> {
    try {
      // Check if username already exists
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create user
      const user = await this.userRepository.create({ username, role });

      // Generate and create token
      const tokenValue = defaultToken ?? this.generateToken();
      const token = await this.tokenRepository.create({
        token: tokenValue,
        userId: user.id
      });

      return {
        ...user,
        token
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async regenerateToken(userId: string): Promise<Token | undefined> {
    try {
      // Delete existing token if any
      await this.tokenRepository.deleteByUserId(userId);

      // Generate new token
      const tokenValue = this.generateToken();
      const token = await this.tokenRepository.create({
        token: tokenValue,
        userId
      });

      return token;
    } catch (error) {
      console.error('Error regenerating token:', error);
      throw error;
    }
  }

  async deleteToken(userId: string): Promise<boolean> {
    try {
      return await this.tokenRepository.deleteByUserId(userId);
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.userRepository.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findByUsername(username);
  }

  private generateToken(): string {
    // Generate a secure random token
    return uuidv4().replace(/-/g, '');
  }
}