export interface SeedUserData {
  username: string;
  tenant: string;
  role: 'admin' | 'user';
  token: string;
}

export interface SeedConfiguration {
  [key: string]: SeedUserData;
}

export const SEED_DATA: SeedConfiguration = {
  admin_a: {
    tenant: 'company_a',
    role: 'admin',
    username: 'admin_a',
    token: 'token_admin_a'
  },
  user_a: {
    tenant: 'company_a',
    role: 'user', 
    username: 'user_a',
    token: 'token_user_a'
  },
  admin_b: {
    tenant: 'company_b',
    role: 'admin',
    username: 'admin_b', 
    token: 'token_admin_b'
  }
};