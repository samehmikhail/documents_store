export interface SeedUserData {
  username: string;
  tenant: string;
  role: 'admin' | 'user';
  token: string;
}

export interface SeedConfiguration {
  [key: string]: SeedUserData;
}

// Loader for seed data from JSON file path defined in env config
import fs from 'fs';
import path from 'path';
import { Config } from '../../../config';

export function loadSeedData(): SeedConfiguration {
  const filePath = path.resolve(process.cwd(), String(Config.SEED_DATA_PATH));
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw) as SeedConfiguration;
    return json;
  } catch (err) {
    // Fallback to empty object to avoid crashes; seeding will no-op
    console.error(`[seed] Failed to load seed data from ${filePath}:`, err);
    return {} as SeedConfiguration;
  }
}