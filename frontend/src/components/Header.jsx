import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const initials = currentUser?.email?.charAt(0).toUpperCase() || '?';

  return (
    <header className="app-header">
      <div className="app-header__brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="app-header__icon">🌤️</span>
        <span className="app-header__title">Weather Insight</span>
      </div>

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
