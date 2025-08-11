import { Request } from 'express';

export interface Tenant {
  id: string;
}

export interface TenantRequest extends Request {
  tenantId: string;
  tenant?: Tenant;
}