import React from 'react';
import EventCard from './EventCard';

export default function ResultsPanel({ messages, loading }) {
  // Extract events from the LAST assistant message that contains an events array
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const lastMessage = assistantMessages[assistantMessages.length - 1];
  
  const events = lastMessage?.events || [];

  if (events.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>
        <div>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔮</span>
          <h2>Awaiting your parameters...</h2>
          <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Describe what you are looking for in the chat to see curated Event recommendations here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', background: 'linear-gradient(135deg, #eaf0ff 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Top AI Matches ({events.length})
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Filtered by Date & scored by Semantic Match
        </p>
      </div>

      <div className="events-grid" style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {events.map((ev, idx) => (
          <EventCard key={ev.id || idx} event={ev} />
        ))}
      </div>
    </div>
  );
}
