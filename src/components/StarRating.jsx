import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './CSS/StarRating.module.css';

export default function StarRating({ rating = 0, onChange, interactive = true, size = 18 }) {
  const [hoverVal, setHoverVal] = useState(null);
  const activeValue = hoverVal !== null ? hoverVal : rating;

  const getRatingValue = (e, starIndex) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    return e.clientX - left < width / 2 ? starIndex - 0.5 : starIndex;
  };

  return (
    <div
      onMouseLeave={() => interactive && setHoverVal(null)}
      className={styles.container}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillAmount = Math.max(0, Math.min(1, activeValue - (starIndex - 1)));

        return (
          <div
            key={starIndex}
            onMouseMove={(e) => interactive && setHoverVal(getRatingValue(e, starIndex))}
            onClick={(e) => interactive && onChange?.(getRatingValue(e, starIndex))}
            className={styles.starWrapper}
            style={{
              width: size,
              height: size,
              cursor: interactive ? 'pointer' : 'default'
            }}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              color="#3f3f46"
              fill="transparent"
              className={styles.starBg}
            />

            {fillAmount > 0 && (
              <div
                className={styles.starFill}
                style={{ width: fillAmount === 0.5 ? '50%' : '100%' }}
              >
                <Star
                  size={size}
                  strokeWidth={1.5}
                  color="#ffffff"
                  fill="#ffffff"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}