import { Request } from 'express';

export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
}

export interface TenantRequest extends Request {
  tenantId: string;
  tenant?: Tenant;
}