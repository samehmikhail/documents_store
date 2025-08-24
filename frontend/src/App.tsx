import { IdentityProvider } from '@/contexts/IdentityContext';
import { IdentityHeader } from '@/components/IdentityHeader';
import { NewEventForm } from '@/components/NewEventForm';
import { EventsTable } from '@/components/EventsTable';

export function App() {
  return (
    <IdentityProvider>
      <div className="container">
        <header>
          <IdentityHeader />
        </header>
        <main>
          <section aria-labelledby="section-b">
            <h2 id="section-b">Section B: Send new event</h2>
            <NewEventForm />
          </section>
          <section aria-labelledby="section-c">
            <h2 id="section-c">Section C: Real-time events</h2>
            <EventsTable />
          </section>
        </main>
      </div>
    </IdentityProvider>
  );
}
