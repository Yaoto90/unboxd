import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import styles from './CSS/Footer.module.css';

const IconSvg = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const TwitterIcon = ({ size }) => (
  <IconSvg size={size}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </IconSvg>
);

const InstagramIcon = ({ size }) => (
  <IconSvg size={size}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </IconSvg>
);

const ThreadsIcon = ({ size }) => (
  <IconSvg size={size}>
    <path d="M19 12a7 7 0 1 0-7 7c2.5 0 4.5-1 5.5-3" />
    <path d="M12 15a3 3 0 1 0-3-3c0 2 1.5 3 3 3z" />
    <path d="M19 7c-1.5-1.5-3.5-2-7-2" />
  </IconSvg>
);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.brandSection}>
          <Link to="/" className={styles.logo}>
            <Film size={22} color="#ffffff" />
            <span>UnBoxd</span>
          </Link>
          <p className={styles.brandTagline}>
            Your social network for film discovery. Track, review, and share the movies you love.
          </p>
        </div>

        <div className={styles.linksGrid}>
          <div className={styles.linkColumn}>
            <h4>Platform</h4>
            <Link to="/">Home</Link>
            <Link to="/search">Search Films</Link>
            <Link to="/profile">My Profile</Link>
          </div>

          <div className={styles.linkColumn}>
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div className={styles.linkColumn}>
            <h4>Social</h4>
            <span className={styles.staticSocialItem}><TwitterIcon size={15} /> Twitter</span>
            <span className={styles.staticSocialItem}><InstagramIcon size={15} /> Instagram</span>
            <span className={styles.staticSocialItem}><ThreadsIcon size={15} /> Threads</span>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} UnBoxd. All film metadata provided by TMDB.</p>
        <div className={styles.legalLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}