export type SeedUserData = {
  username: string;
  tenant: string;
  role: 'admin' | 'user';
  token: string;
};
export type SeedConfiguration = Record<string, SeedUserData>;

// Frontend can fetch shared seed data if needed (e.g., to show example tokens)
export async function fetchSeedData(): Promise<SeedConfiguration> {
  try {
  const path = import.meta.env.VITE_SEED_DATA_PATH || '/seed/seedData.json';
  const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed ${res.status}`);
    return (await res.json()) as SeedConfiguration;
  } catch (e) {
    console.error('Failed to fetch seed data:', e);
    return {} as SeedConfiguration;
  }
}
