import { Response } from 'express';
import { authService } from '../services/auth';
import { AuthRequest } from '../middleware/auth';
import { LocalizedRequest } from '../middleware/localization';
import { ApiResponse, LoginRequest, RegisterRequest } from '../types';

type AuthControllerRequest = AuthRequest & LocalizedRequest;

export class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: User login
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  async login(req: AuthControllerRequest, res: Response): Promise<void> {
    try {
      const { username, password }: LoginRequest = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.required') || 'Username and password are required'
        } as ApiResponse);
        return;
      }

      const authToken = await authService.login({ username, password });

      if (!authToken) {
        res.status(401).json({
          success: false,
          message: req.t?.('auth.loginFailed') || 'Invalid credentials'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: authToken,
        message: req.t?.('auth.loginSuccess') || 'Login successful'
      } as ApiResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: User registration
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Invalid input or user already exists
   */
  async register(req: AuthControllerRequest, res: Response): Promise<void> {
    try {
      const { username, email, password }: RegisterRequest = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: req.t?.('validation.required') || 'All fields are required'
        } as ApiResponse);
        return;
      }

      const newUser = await authService.register({ username, email, password });

      if (!newUser) {
        res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        } as ApiResponse);
        return;
      }

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User registered successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: User logout
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  async logout(req: AuthControllerRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (userId) {
        authService.logout(userId);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      } as ApiResponse);
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: req.t?.('server.error') || 'Internal server error'
      } as ApiResponse);
    }
  }
}

export const authController = new AuthController();