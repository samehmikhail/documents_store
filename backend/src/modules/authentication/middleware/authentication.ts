import { Request, Response, NextFunction } from 'express';
import { UserWithToken } from '../types/user';
import { TenantRequest } from '../../multi-tenant/types/tenant';
import { databaseManager } from '../../../database/manager';
import { AuthenticationService } from '../services/authenticationService';

export interface AuthenticatedRequest extends TenantRequest {
  user: UserWithToken;
}

export const authenticationMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers['x-user-token'] as string;

    // Check if token is provided
    if (!token) {
      res.status(401).json({
        success: false,
        message: req.t?.('auth:tokenMissing') || 'User token is required. Please provide X-User-Token header.',
        code: 'USER_TOKEN_MISSING'
      });
      return;
    }

    // Get tenant request (should be available from tenant middleware)
    const tenantRequest = req as TenantRequest;
    if (!tenantRequest.tenantId) {
      res.status(400).json({
        success: false,
        message: req.t?.('auth:tenantIdMissing') || 'Tenant ID is required.',
        code: 'TENANT_ID_MISSING'
      });
      return;
    }

    // Get database for the tenant
    const database = await databaseManager.getDatabase(tenantRequest.tenantId);
    const authService = new AuthenticationService(database);

    // Find user by token
    const user = await authService.findUserByToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        message: req.t?.('auth:invalidToken') || 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Add user information to request
    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.user = user;

    // Log successful authentication (without sensitive data)
    console.log(`User authenticated: ${user.username} (${user.role}) for tenant: ${tenantRequest.tenantId}`);

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: req.t?.('server.error') || 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};