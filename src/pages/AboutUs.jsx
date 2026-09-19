import { Film, Heart, Users, Shield, Mail, Phone } from 'lucide-react';
import styles from './CSS/AboutUs.module.css';

const CARDS = [
  {
    icon: Heart,
    title: 'Log Your Life in Film',
    desc: 'Keep a comprehensive diary of everything you watch. Rate films, write reviews, and curate custom watchlists to share your unique cinematic taste with the world.'
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'Engage with a passionate community of movie lovers. Read reviews from friends, drop likes, and dive deep into nested comment threads discussing your favorite scenes.'
  },
  {
    icon: Shield,
    title: 'Curated & Moderated',
    desc: 'We believe in quality discourse. Our platform utilizes dedicated moderation tools to keep discussions respectful, spoiler-free when requested, and focused purely on the art of film.'
  }
];

export default function AboutUs() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.heroSection}>
        <Film size={48} color="#ef4444" className={styles.heroIcon} />
        <h1 className={styles.title}>About UnBoxd</h1>
        <p className={styles.subtitle}>
          The premier social network for cinephiles. Discover, log, and discuss the world of cinema.
        </p>
      </div>

      <div className={styles.contentGrid}>
        {CARDS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className={styles.glassCard}>
            <Icon size={24} color="#ef4444" className={styles.cardIcon} />
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.missionSection}>
        <h2>Our Mission</h2>
        <p>
          UnBoxd was built to bridge the gap between casual movie tracking and deep cinematic discourse. We utilize real-time data from TMDB to ensure our catalog is always up to date, giving you the perfect canvas to document your cinematic journey.
        </p>

        <div className={styles.contactDetailsRow}>
          <a href="mailto:support@unboxd.com" className={styles.contactPill}>
            <Mail size={16} color="#ef4444" />
            <span>support@unboxd.com</span>
          </a>
          <a href="tel:+15558626931" className={styles.contactPill}>
            <Phone size={16} color="#ef4444" />
            <span>+1 (555) 862-6931</span>
          </a>
        </div>
      </div>
    </div>
  );
}