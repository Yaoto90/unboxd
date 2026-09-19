import styles from './CSS/LegalPrivacy.module.css';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'When you create an account on UnBoxd, we collect your email address, selected username, and optional profile avatar. When you interact with the app, we log the films you mark as watched, add to your watchlist, or review.'
  },
  {
    title: '2. Third-Party Services & Metadata',
    body: 'Film information, artwork, and cast listings are supplied via The Movie Database (TMDB) API. UnBoxd does not transmit your personal profile information to TMDB. All authentication and database operations are managed via Supabase with secure Row Level Security (RLS).'
  },
  {
    title: '3. How Your Data Is Protected',
    body: 'We enforce strict access controls. Passwords are never stored in plaintext and are protected by cryptographic hashing. Only platform administrators have access to moderation records, and contact submissions are restricted strictly to authorized staff.'
  },
  {
    title: '4. Your Rights',
    body: 'You have full ownership of your data. You can edit or delete your reviews, purge your watchlist entries, or request permanent deletion of your profile and submitted content at any time.'
  }
];

export default function LegalPrivacy() {
  return (
    <div className={styles.legalContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroIconWrapper}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>
          Last updated: September 2026. Your privacy and data security are central to how UnBoxd operates.
        </p>
      </div>

      <div className={styles.cardList}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} className={styles.glassCard}>
            <h2 className={styles.cardTitle}>{sec.title}</h2>
            <p>{sec.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}