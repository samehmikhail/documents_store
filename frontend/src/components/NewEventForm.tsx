import { useState } from 'react';
import { useIdentity } from '@/contexts/IdentityContext';
import { eventsService } from '@/services/eventsService';

export function NewEventForm() {
  const { tenant, token } = useIdentity();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setPending(true);
    try {
      await eventsService.publish({
        tenant,
        token,
        message: message.trim(),
      });
      setMessage('');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: '12px' }}>
      <div className="field">
        <label htmlFor="message">Message</label>
        <input
          id="message"
          type="text"
          placeholder="Type an event message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" disabled={pending || !message.trim()} style={{ width: 'fit-content' }}>
        {pending ? 'Sending…' : 'Send event'}
      </button>
    </form>
  );
}
