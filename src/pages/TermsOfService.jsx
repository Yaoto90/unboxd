import { FileText, UserCheck, MessageSquare, AlertCircle } from 'lucide-react';
import styles from './CSS/TermsOfService.module.css';

const SECTIONS = [
  {
    icon: UserCheck,
    title: '1. Account Responsibilities',
    body: 'By creating an account, you agree to provide accurate information and keep your credentials secure. You are responsible for all reviews, comments, and activities conducted under your username.'
  },
  {
    icon: MessageSquare,
    title: '2. Community Conduct & Spoilers',
    body: 'UnBoxd values civil, cinema-first discourse. Hate speech, targeted harassment, spam, and unsolicited promotion are prohibited. When sharing major plot details, you are expected to mark reviews with spoiler flags to preserve the experience for others.'
  },
  {
    icon: AlertCircle,
    title: '3. Content Moderation & Termination',
    body: 'Our administration team reserves the right to remove reviews, comments, or entire profiles that breach platform guidelines or compromise community safety without prior notice.'
  },
  {
    icon: FileText,
    title: '4. Intellectual Property',
    body: 'You retain ownership over the written reviews you submit. Film metadata and posters remain the intellectual property of their respective creators and distributors, provided through TMDB.'
  }
];

export default function TermsOfService() {
  return (
    <div className={styles.legalContainer}>
      <div className={styles.heroSection}>
        <FileText size={44} color="#ef4444" className={styles.heroIcon} />
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.subtitle}>
          Please read these terms carefully before engaging with the UnBoxd community.
        </p>
      </div>

      <div className={styles.cardList}>
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <Icon size={20} color="#ef4444" />
              <h2>{title}</h2>
            </div>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}