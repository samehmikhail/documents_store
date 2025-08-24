import type { TenantId } from '@/contexts/IdentityContext';

export interface PublishEventInput {
  tenant: TenantId;
  token: string; // forwarded but unused for now
  message: string;
}

export interface EventRecord {
  id: string;
  createdAt: number;
  message: string;
  createdBy: string;
  tenant: TenantId;
}

type Subscriber = (events: EventRecord[]) => void;

class EventsService {
  private store = new Map<TenantId, EventRecord[]>();
  private subs = new Map<TenantId, Set<Subscriber>>();

  publish = async (input: PublishEventInput): Promise<EventRecord> => {
    const record: EventRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      message: input.message,
      createdBy: input.token || 'anonymous',
      tenant: input.tenant,
    };
    const list = this.store.get(input.tenant) ?? [];
    const next = [record, ...list].slice(0, 200);
    this.store.set(input.tenant, next);
    this.notify(input.tenant);
    return record;
  };

  subscribe = (tenant: TenantId, fn: Subscriber) => {
    const set = this.subs.get(tenant) ?? new Set<Subscriber>();
    set.add(fn);
    this.subs.set(tenant, set);
    // initial call
    fn(this.getSnapshot(tenant));
    return () => {
      const cur = this.subs.get(tenant);
      if (!cur) return;
      cur.delete(fn);
      if (cur.size === 0) this.subs.delete(tenant);
    };
  };

  getSnapshot = (tenant: TenantId): EventRecord[] => {
    return [...(this.store.get(tenant) ?? [])];
  };

  private notify(tenant: TenantId) {
    const list = this.getSnapshot(tenant);
    const set = this.subs.get(tenant);
    if (!set) return;
    for (const fn of set) fn(list);
  }
}

export const eventsService = new EventsService();
