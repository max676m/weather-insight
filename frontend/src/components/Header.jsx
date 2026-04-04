import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = currentUser?.email?.charAt(0).toUpperCase() || '?';

  return (
    <header className="app-header">
      <div className="app-header__brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="app-header__icon">🌤️</span>
        <span className="app-header__title">Weather Insight</span>
      </div>

      <nav className="app-header__nav">
        <button
          id="nav-experiments"
          className={`app-header__nav-link${location.pathname === '/experiments' ? ' app-header__nav-link--active' : ''}`}
          onClick={() => navigate('/experiments')}
        >
          🧪 Experiments
        </button>
        <button
          id="nav-events-ai"
          className={`app-header__nav-link${location.pathname === '/events-ai-assistant' ? ' app-header__nav-link--active' : ''}`}
          onClick={() => navigate('/events-ai-assistant')}
        >
          ✨ Events AI Assistant
        </button>
      </nav>

      <button
        id="user-avatar-btn"
        className="app-header__avatar"
        onClick={() => navigate('/profile')}
        title="View Profile"
      >
        {initials}
      </button>
    </header>
  );
}
