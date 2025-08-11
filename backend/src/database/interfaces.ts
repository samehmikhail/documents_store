// Abstract database connection interface
export interface IDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes: number }>;
  close(): Promise<void>;
}

// Repository base interface
export interface IRepository<T> {
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}