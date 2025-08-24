import { useEffect, useRef, useState } from 'react';
import { useIdentity } from '@/contexts/IdentityContext';
import { eventsService, type EventRecord } from '@/services/eventsService';

export function EventsTable() {
  const { tenant, token } = useIdentity();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [flash, setFlash] = useState(false);
  const prevCount = useRef<number>(0);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    setEvents(eventsService.getSnapshot(tenant));
    prevCount.current = eventsService.getSnapshot(tenant).length;
    const unsub = eventsService.subscribe(tenant, token, (list) => {
      setEvents(list);
      if (list.length > prevCount.current) {
        setFlash(true);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), 2000);
      }
      prevCount.current = list.length;
    });
    return () => {
      unsub();
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, [tenant, token]);

  return (
    <div className="card">
      {flash && (
        <div style={{
          background: '#e6ffed',
          border: '1px solid #b7eb8f',
          color: '#389e0d',
          padding: '6px 10px',
          borderRadius: '6px',
          marginBottom: '8px',
          fontSize: '0.9rem',
        }}>
          New event received
        </div>
      )}
      <table className="events-table">
        <thead>
          <tr>
            <th>Creation time</th>
            <th>Message</th>
            <th>Created by</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>
                No events yet
              </td>
            </tr>
          ) : (
            events.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                <td>{e.message}</td>
                <td>{e.createdBy || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
