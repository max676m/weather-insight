import { useState } from 'react';
import WeatherCard from './components/WeatherCard.jsx';
import FactsList from './components/FactsList.jsx';
import './App.css';

/* ── Mock data used until the backend is wired up ── */
const MOCK_RESPONSE = {
  location: 'Paris',
  country: 'France',
  weather: {
    temperature_c: 11,
    condition: 'Overcast',
    humidity: 66,
    wind_kph: 9.4,
  },
  air_quality: {
    pm2_5: 16.05,
    pm10: 20.65,
  },
  facts: [
    'Paris is one of the world\'s most visited cities.',
    'The city is famous for art, culture, and cuisine.',
    'Paris can experience heavy tourist crowds during peak seasons.',
  ],
};

const USE_MOCK = false; // flip to true for standalone UI testing

function App() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      if (USE_MOCK) {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));
        setData({ ...MOCK_RESPONSE, location: trimmed });
      } else {
        const res = await fetch(`/api/location-info?location=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="app">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />

      <header className="header">
        <h1 className="header__title">
          <span className="header__icon">🌤️</span> Weather Insight
        </h1>
        <p className="header__subtitle">
          Search any location for live weather &amp; AI‑generated facts
        </p>
      </header>

      <section className="search" id="search-section">
        <div className="search__bar">
          <input
            id="search-input"
            className="search__input"
            type="text"
            placeholder="Enter a city — e.g. Paris, Tokyo, New York…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            id="search-button"
            className="search__button"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>🔍 Search</>
            )}
          </button>
        </div>
      </section>

      <main className="results" id="results-section">
        {error && (
          <div className="error-card">
            <span className="error-card__icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div className="results__grid">
            <WeatherCard data={data} />
            <FactsList facts={data.facts} location={data.location} />
          </div>
        )}

        {!data && !loading && !error && (
          <div className="empty-state">
            <span className="empty-state__icon">🌍</span>
            <p>Type a location above and hit <strong>Search</strong> to get started.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Weather Insight &copy; 2026 — Powered by AI</p>
      </footer>
    </div>
  );
}

export default App;
