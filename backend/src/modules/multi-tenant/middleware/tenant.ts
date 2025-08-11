import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from '../types/tenant';
import { tenantStore } from '../services/tenantStore';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string;

  // Check if tenant ID is provided
  if (!tenantId) {
    res.status(400).json({
      success: false,
      message: req.t('auth:tenantIdMissing'),
      code: 'TENANT_ID_MISSING'
    });
    return;
  }

  // Validate tenant exists and is active
  if (!tenantStore.isValidTenant(tenantId)) {
    res.status(404).json({
      success: false,
      message: req.t('auth:tenantInvalid'),
      code: 'TENANT_INVALID'
    });
    return;
  }

  // Add tenant information to request
  const tenantRequest = req as TenantRequest;
  tenantRequest.tenantId = tenantId;
  tenantRequest.tenant = tenantStore.getTenant(tenantId);

  next();
};