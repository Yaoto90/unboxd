import { useState } from 'react';
import { Star } from 'lucide-react';

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
      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillAmount = Math.max(0, Math.min(1, activeValue - (starIndex - 1)));

        return (
          <div
            key={starIndex}
            onMouseMove={(e) => handleMouseMove(e, starIndex)}
            onClick={(e) => handleClick(e, starIndex)}
            style={{
              position: 'relative',
              width: size,
              height: size,
              cursor: interactive ? 'pointer' : 'default',
              userSelect: 'none'
            }}
          >
            {/* Background Empty Star */}
            <Star
              size={size}
              strokeWidth={1.5}
              color="#3f3f46"
              fill="transparent"
              style={{ position: 'absolute', inset: 0 }}
            />

            {/* Filled Star Overlay with clipping */}
            {fillAmount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: fillAmount === 0.5 ? '50%' : '100%',
                  overflow: 'hidden',
                  pointerEvents: 'none'
                }}
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