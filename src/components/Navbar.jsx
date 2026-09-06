import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: '#050505',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '6px 12px',
                background: '#111111',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 500
              }}
            >
              <User size={13} />
              <span>{profile?.username || user.email?.split('@')[0]}</span>
            </Link>

            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}