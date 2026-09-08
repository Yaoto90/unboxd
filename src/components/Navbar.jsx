import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, LogOut, User, LogIn } from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const username = profile?.username || user?.email?.split('@')[0] || 'Member';

  return (
    <header style={{
      borderBottom: '1px solid #1a1a1a',
      backgroundColor: 'rgba(5, 5, 5, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.8rem'
      }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <Clapperboard size={20} color="#ffffff" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px' }}>
            UnBoxd
          </span>
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '5px 12px 5px 6px',
                background: '#111111',
                border: '1px solid #222222',
                borderRadius: '20px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#404040')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222222')}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#222222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={13} color="#a3a3a3" />
                )}
              </div>
              <span>{username}</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Log out"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '7px 12px',
                background: '#0a0a0a',
                border: '1px solid #222222',
                borderRadius: '8px',
                color: '#8a8a8a',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#383838';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8a8a8a';
                e.currentTarget.style.borderColor = '#222222';
              }}
            >
              <LogOut size={13} />
              <span className="hide-mobile">Log out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => onOpenAuth('signin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '7px 14px',
                background: 'transparent',
                border: '1px solid #262626',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              style={{
                padding: '7px 15px',
                background: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '8px',
                color: '#000000',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}