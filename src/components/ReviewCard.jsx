import { useState, useEffect } from 'react';
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
  onCloseModal,
  onOpenAuth
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(
    review.review_likes?.some((l) => l.user_id === user?.id) || false
  );
  const [likeCount, setLikeCount] = useState(review.review_likes?.length || 0);
  const [loadingLike, setLoadingLike] = useState(false);

  useEffect(() => {
    setLiked(review.review_likes?.some((l) => l.user_id === user?.id) || false);
    setLikeCount(review.review_likes?.length || 0);
  }, [user, review]);

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (typeof onOpenAuth === 'function') {
        onOpenAuth('signin');
      } else {
        alert('Please sign in to like reviews.');
      }
      return;
    }
    if (loadingLike) return;

    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!previousLiked);
    setLikeCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1));
    setLoadingLike(true);

    try {
      if (previousLiked) {
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('review_likes')
          .insert({ review_id: review.id, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to update like:', err);
      setLiked(previousLiked);
      setLikeCount(previousCount);
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

  const username = review.profiles?.username || 'user';
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelectMovie && onSelectMovie(review.tmdb_movie_id)}
      style={{
        background: '#0d0d0d',
        border: '1px solid #242424',
        borderRadius: '16px',
        padding: '2rem 2.25rem',
        display: 'flex',
        gap: '1.75rem',
        cursor: onSelectMovie ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        width: '100%',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        if (onSelectMovie) {
          e.currentTarget.style.borderColor = '#404040';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onSelectMovie) {
          e.currentTarget.style.borderColor = '#242424';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Movie Poster (When shown in community feed) */}
      {showMoviePoster && review.movie_poster_path && (
        <div style={{ width: '95px', height: '142px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#141414', border: '1px solid #242424' }}>
          <img
            src={getImageUrl(review.movie_poster_path, 'w185')}
            alt={review.movie_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Review Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {showMoviePoster && (
            <h4 style={{
              margin: '0 0 0.6rem 0',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {review.movie_title}
            </h4>
          )}

          {/* User Row + Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div
              onClick={handleUserClick}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#1a1a1a',
                border: '1px solid #333333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#ffffff',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {review.profiles?.avatar_url ? (
                  <img
                    src={review.profiles.avatar_url}
                    alt={username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initial
                )}
              </div>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
              >
                {username}
              </span>
            </div>

            <span style={{ color: '#444444', fontSize: '1rem' }}>•</span>
            <StarRating rating={review.rating || 0} interactive={false} size={20} />
          </div>

          {/* Large Review Text */}
          <p style={{
            margin: 0,
            fontSize: '1.28rem',
            color: '#f0f0f0',
            lineHeight: '1.7',
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {review.review_text}
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            onClick={handleToggleLike}
            title={liked ? 'Unlike' : 'Like'}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: liked ? '#ef4444' : '#888888',
              cursor: 'pointer',
              padding: '6px 0',
              fontSize: '1.05rem',
              fontWeight: 700,
              transition: 'color 0.15s ease, transform 0.1s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Heart size={20} fill={liked ? '#ef4444' : 'transparent'} />
            <span>{likeCount}</span>
          </button>

          {user?.id === review.user_id && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(review.id);
              }}
              title="Delete review"
              style={{
                background: 'none',
                border: 'none',
                color: '#737373',
                cursor: 'pointer',
                padding: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}