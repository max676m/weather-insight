import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const email = currentUser?.email || '';

  return (
    <div className="app">
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />

      <div className="profile-container">
        <button className="profile-back-btn" onClick={() => navigate('/')}>
          ← Back to Search
        </button>

        <div className="profile-card">
          {/* Avatar */}
          <div className="profile-avatar">
            <span className="profile-avatar__icon">👤</span>
          </div>

          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-email">{email}</p>

          <div className="profile-divider" />

          <div className="profile-info-row">
            <span className="profile-info-label">Account type</span>
            <span className="profile-info-value">Free</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Member since</span>
            <span className="profile-info-value">
              {currentUser?.metadata?.creationTime
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>

          <button id="logout-button" className="profile-logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
