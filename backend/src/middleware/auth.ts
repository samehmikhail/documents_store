import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../config';
import { database } from '../models/database';
import { UserRole } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, Config.JWT_SECRET as string) as any;
    const user = database.getUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

export { AuthRequest };