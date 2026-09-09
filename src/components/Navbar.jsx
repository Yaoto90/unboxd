import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, LogOut, User, LogIn } from 'lucide-react';
import styles from './CSS/Navbar.module.css';

export default function Navbar({ onOpenAuth }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const username = profile?.username || user?.email?.split('@')[0] || 'Member';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <Clapperboard size={22} color="#ffffff" />
          <span className={styles.brandTitle}>UnBoxd</span>
        </Link>

        {user ? (
          <div className={styles.actions}>
            <Link to="/profile" className={styles.profilePill}>
              <div className={styles.avatarCircle}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={username} className={styles.avatarImg} />
                ) : (
                  <User size={14} color="#a3a3a3" />
                )}
              </div>
              <span className={styles.hideMobile}>{username}</span>
            </Link>

            <button onClick={handleLogout} title="Log out" className={styles.logoutBtn}>
              <LogOut size={16} />
              <span className={styles.hideMobile}>Log out</span>
            </button>
          </div>
        ) : (
          <div className={styles.authGroup}>
            <button onClick={() => onOpenAuth('signin')} className={styles.signInBtn}>
              <LogIn size={18} />
              <span className={styles.hideMobile}>Sign In</span>
            </button>

            <button onClick={() => onOpenAuth('signup')} className={styles.signUpBtn}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}