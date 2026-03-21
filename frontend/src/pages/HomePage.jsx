import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import WeatherCard from '../components/WeatherCard';
import FactsList from '../components/FactsList';
import SearchHistory from '../components/SearchHistory';

const MAX_HISTORY = 5;

export default function HomePage() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  /* ── Load history from Firestore on mount ── */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setHistory(snap.data().history || []);
        }
      } catch (err) {
        console.error('Failed to load search history:', err);
      }
    };
    fetchHistory();
  }, [currentUser]);

  /* ── Save history entry to Firestore ── */
  const saveToHistory = async (location) => {
    const updated = [location, ...history.filter((h) => h.toLowerCase() !== location.toLowerCase())].slice(0, MAX_HISTORY);
    setHistory(updated); // Optimistic UI update

    try {
      const ref = doc(db, 'users', currentUser.uid);
      await setDoc(ref, { history: updated }, { merge: true });
    } catch (err) {
      console.error('Failed to save search history to Firestore:', err);
    }
  };

  /* ── Perform weather search ── */
  const handleSearch = async (searchQuery) => {
    const trimmed = (searchQuery || query).trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/location-info?location=${encodeURIComponent(trimmed)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }

      const json = await res.json();
      setData(json);
      await saveToHistory(json.location || trimmed);
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

      <Header />

      <div className="page-subtitle">
        <p>Search any location for live weather &amp; AI‑generated facts</p>
      </div>

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
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <>🔍 Search</>}
          </button>
        </div>

        {/* Search History */}
        <SearchHistory history={history} onSelect={handleSearch} />
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
