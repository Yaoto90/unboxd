import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, LogOut, User, LogIn, Home, Search } from 'lucide-react';
import styles from './CSS/Navbar.module.css';

const UserAvatar = ({ avatarUrl, username, className }) => (
  <div className={className}>
    {avatarUrl ? (
      <img src={avatarUrl} alt={username} className={styles.avatarImg} />
    ) : (
      <User size={14} color="#a3a3a3" />
    )}
  </div>
);

export default function Navbar({ onOpenAuth, onOpenSearch }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const username = profile?.username || user?.email?.split('@')[0] || 'Member';

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to="/" className={styles.brand}>
            <Clapperboard size={22} color="#ffffff" />
            <span className={styles.brandTitle}>UnBoxd</span>
          </Link>

          <div className={styles.desktopActions}>
            {user ? (
              <>
                <Link to="/profile" className={styles.profilePill}>
                  <UserAvatar avatarUrl={profile?.avatar_url} username={username} className={styles.avatarCircle} />
                  <span>{username}</span>
                </Link>
                <button onClick={handleLogout} title="Log out" className={styles.logoutBtn}>
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <div className={styles.authGroup}>
                <button onClick={() => onOpenAuth('signin')} className={styles.signInBtn}>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
                <button onClick={() => onOpenAuth('signup')} className={styles.signUpBtn}>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className={styles.bottomNav}>
        <Link to="/" className={styles.navItem}>
          <Home size={22} />
        </Link>
        <button onClick={onOpenSearch} className={styles.navItem}>
          <Search size={22} />
        </button>

        {user ? (
          <>
            <Link to="/profile" className={styles.navItem}>
              <UserAvatar avatarUrl={profile?.avatar_url} username={username} className={styles.avatarCircleMobile} />
            </Link>
            <button onClick={handleLogout} className={styles.navItem}>
              <LogOut size={22} color="#ef4444" />
            </button>
          </>
        ) : (
          <button onClick={() => onOpenAuth('signin')} className={styles.navItem}>
            <User size={22} />
          </button>
        )}
      </nav>
    </>
  );
}