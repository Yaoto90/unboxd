import styles from './CSS/SkeletonGrid.module.css';

export function MovieCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={`skeleton-box ${styles.poster}`} />
      <div className={styles.body}>
        <div className={`skeleton-box ${styles.titleLine}`} />
        <div className={styles.metaRow}>
          <div className={`skeleton-box ${styles.metaPillYear}`} />
          <div className={`skeleton-box ${styles.metaPillScore}`} />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 18 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}