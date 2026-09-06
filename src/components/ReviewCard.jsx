import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import { Heart, Trash2 } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';

export default function ReviewCard({
  review,
  onSelectMovie,
  onDelete,
  showMoviePoster = false,
  onCloseModal
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialLiked = review.review_likes?.some((l) => l.user_id === user?.id) || false;
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(review.review_likes?.length || 0);
  const [loadingLike, setLoadingLike] = useState(false);

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!user) return alert('Please sign in to like reviews.');
    if (loadingLike) return;

    setLoadingLike(true);
    try {
      if (liked) {
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', user.id);
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('review_likes')
          .insert({ review_id: review.id, user_id: user.id });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLike(false);
    }
  };

const handleUserClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const username = review.profiles?.username;
    if (username) {
      if (typeof onCloseModal === 'function') {
        onCloseModal();
      }
      navigate(`/user/${username}`);
    }
  };
  return (
    <div
      onClick={() => onSelectMovie && onSelectMovie(review.tmdb_movie_id)}
      style={{
        background: '#0a0a0a',
        border: '1px solid #1f1f23',
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        gap: '1rem',
        cursor: onSelectMovie ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease'
      }}
      onMouseEnter={(e) => onSelectMovie && (e.currentTarget.style.borderColor = '#3f3f46')}
      onMouseLeave={(e) => onSelectMovie && (e.currentTarget.style.borderColor = '#1f1f23')}
    >
      {showMoviePoster && review.movie_poster_path && (
        <img
          src={getImageUrl(review.movie_poster_path, 'w185')}
          alt={review.movie_title}
          style={{ width: '48px', height: '72px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
          {showMoviePoster && (
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {review.movie_title}
            </h4>
          )}

          <span
            onClick={handleUserClick}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#e4e4e7',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {review.profiles?.username || 'User'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <StarRating rating={review.rating || 0} interactive={false} size={11} />
        </div>

        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.82rem',
          color: '#a1a1aa',
          lineHeight: '1.45'
        }}>
          {review.review_text}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleToggleLike}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: liked ? '#ef4444' : '#71717a',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.75rem'
            }}
          >
            <Heart size={13} fill={liked ? '#ef4444' : 'transparent'} />
            <span>{likeCount}</span>
          </button>

          {user?.id === review.user_id && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(review.id);
              }}
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}