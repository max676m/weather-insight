import Header from '../components/Header';
import UmbrellaReflow from '../components/UmbrellaReflow';
import './ExperimentsPage.css';

export default function ExperimentsPage() {
  return (
    <div className="app">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />

      <Header />

      <div className="experiments-hero">
        <span className="experiments-hero__badge">🧪 Experiment</span>
        <h1 className="experiments-hero__title">Umbrella Text Reflow</h1>
        <p className="experiments-hero__desc">
          Drag the umbrella and watch text dynamically reflow around it in
          real-time — powered by canvas font metrics and shape-exclusion math.
        </p>
      </div>

      <section className="experiments-canvas-section" id="experiment-canvas">
        <UmbrellaReflow />
      </section>

      <footer className="footer">
        <p>Weather Insight &copy; 2026 — Powered by AI</p>
      </footer>
    </div>
  );
}
