import { useEffect, useState } from 'react';
import { useIdentity } from '@/contexts/IdentityContext';
import { eventsService, type EventRecord } from '@/services/eventsService';

export function EventsTable() {
  const { tenant } = useIdentity();
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    setEvents(eventsService.getSnapshot(tenant));
    const unsub = eventsService.subscribe(tenant, (list) => setEvents(list));
    return () => unsub();
  }, [tenant]);

  return (
    <div className="card">
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
