import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './CSS/StarRating.module.css';

export default function StarRating({ rating = 0, onChange, interactive = true, size = 18 }) {
  const [hoverVal, setHoverVal] = useState(null);
  const activeValue = hoverVal !== null ? hoverVal : rating;

  const handleMouseMove = (e, starIndex) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverVal(isLeftHalf ? starIndex - 0.5 : starIndex);
  };

  const handleClick = (e, starIndex) => {
    if (!interactive || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    onChange(isLeftHalf ? starIndex - 0.5 : starIndex);
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
            onMouseMove={(e) => handleMouseMove(e, starIndex)}
            onClick={(e) => handleClick(e, starIndex)}
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