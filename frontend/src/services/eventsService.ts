import type { TenantId } from '@/contexts/IdentityContext';
import { io, Socket } from 'socket.io-client';

// Backend defaults; can be overridden by Vite env vars
const BACKEND_URL = (typeof window !== 'undefined' && (window as any).__NB_BACKEND_URL__) || (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000';
const NAMESPACE = '/events';

export interface PublishEventInput {
  tenant: TenantId;
  token: string; // used for WS auth
  message: string;
}

export interface EventRecord {
  id: string;
  createdAt: number; // epoch ms
  message: string;
  createdBy: string;
  tenant: TenantId;
}

type Subscriber = (events: EventRecord[]) => void;

type BackendEvent = {
  id: string;
  tenant_id: string;
  message: string;
  timestamp: string; // ISO
  author?: string;
};

class EventsService {
  private store = new Map<TenantId, EventRecord[]>();
  private ids = new Map<TenantId, Set<string>>();
  private subs = new Map<TenantId, Set<Subscriber>>();
  private sockets = new Map<TenantId, Socket>();

  private ensureSocket(tenant: TenantId, token: string): Socket {
    const existing = this.sockets.get(tenant);
    if (existing) {
      // If auth token changed, re-authenticate by reconnecting
      const auth = (existing as any).auth as { tenantId?: string; token?: string } | undefined;
      if (!auth || auth.token !== token) {
        try { existing.disconnect(); } catch {}
        this.sockets.delete(tenant);
      } else {
        return existing;
      }
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE}`, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      auth: { tenantId: tenant, token },
    });

    // Keep a reference for later checks
    (socket as any).auth = { tenantId: tenant, token };

    socket.on('connect', () => {
      // console.debug('WS connected', tenant);
    });

    socket.on('disconnect', () => {
      // console.debug('WS disconnected', tenant);
    });

    socket.on('snapshot', (events: BackendEvent[]) => {
      const mapped = events.map((e) => this.mapBackendEvent(e)).sort((a, b) => b.createdAt - a.createdAt);
      this.store.set(tenant, mapped);
      this.ids.set(tenant, new Set(mapped.map((e) => e.id)));
      this.notify(tenant);
    });

    socket.on('event_created', (event: BackendEvent) => {
      const rec = this.mapBackendEvent(event);
      const list = this.store.get(tenant) ?? [];
      const idset = this.ids.get(tenant) ?? new Set<string>();
      if (!idset.has(rec.id)) {
        const next = [rec, ...list].slice(0, 500);
        idset.add(rec.id);
        this.store.set(tenant, next);
        this.ids.set(tenant, idset);
        this.notify(tenant);
      }
    });

    socket.on('error', (err: any) => {
      console.error('WS error', err);
    });

    this.sockets.set(tenant, socket);
    return socket;
  }

  publish = async (input: PublishEventInput): Promise<EventRecord> => {
    const socket = this.ensureSocket(input.tenant, input.token);
    const record: EventRecord = await new Promise((resolve, reject) => {
      socket.timeout(5000).emit('post_event', { message: input.message }, (response: any) => {
        if (!response || response.code) {
          return reject(new Error(response?.message || 'Failed to post event'));
        }
        const backend: BackendEvent = response.event;
        resolve(this.mapBackendEvent(backend));
      });
    });

    // We rely on server broadcast to insert and dedupe, but ensure it's in our store quickly as well
    const list = this.store.get(input.tenant) ?? [];
    const idset = this.ids.get(input.tenant) ?? new Set<string>();
    if (!idset.has(record.id)) {
      const next = [record, ...list].slice(0, 500);
      idset.add(record.id);
      this.store.set(input.tenant, next);
      this.ids.set(input.tenant, idset);
      this.notify(input.tenant);
    }
    return record;
  };

  subscribe = (tenant: TenantId, token: string, fn: Subscriber) => {
    // Ensure connection only if we have a token
    if (token) this.ensureSocket(tenant, token);

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
      // Optionally close socket if no subscribers
      if (!this.subs.has(tenant)) {
        const s = this.sockets.get(tenant);
        if (s) {
          try { s.disconnect(); } catch {}
          this.sockets.delete(tenant);
        }
      }
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

  private mapBackendEvent(e: BackendEvent): EventRecord {
    return {
      id: e.id,
      tenant: e.tenant_id as TenantId,
      message: e.message,
      createdAt: Date.parse(e.timestamp),
      createdBy: e.author || '—',
    };
  }
}

export const eventsService = new EventsService();
