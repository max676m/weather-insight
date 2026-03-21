import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?$/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />

      <div className="login-container">
        <div className="login-card">
          <div className="login-card__logo">🌤️</div>
          <h1 className="login-card__title">Weather Insight</h1>
          <p className="login-card__subtitle">
            {isSignup ? 'Create your account to get started' : 'Sign in to explore live weather & AI facts'}
          </p>

          {error && (
            <div className="login-card__error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-form__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="login-form__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="login-form__label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="login-form__input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <button
              id="login-submit"
              className="login-form__button"
              type="submit"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : (isSignup ? '✨ Create Account' : '→ Sign In')}
            </button>
          </form>

          <p className="login-card__toggle">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              className="login-card__toggle-btn"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
