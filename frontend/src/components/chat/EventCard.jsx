import React from 'react';
import './EventCard.css';

export default function EventCard({ event }) {
  // If match_score >= 80, badge glows green; else amber
  const isHighMatch = event.match_score >= 80;

  return (
    <div className={`event-card ${isHighMatch ? 'high-match' : ''}`}>
      <div className="event-card-header">
        <div className={`match-badge ${isHighMatch ? 'green' : 'amber'}`}>
          {event.match_score}% Match
        </div>
      </div>
      
      <div className="event-card-body">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-location">📍 {event.location || 'Unknown Location'}</p>
        <p className="event-description">{event.description}</p>
      </div>
      
      <div className="event-card-footer">
        <button className="register-btn">View Event</button>
      </div>
    </div>
  );
}
