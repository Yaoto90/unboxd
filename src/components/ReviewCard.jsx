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
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '10px',
        padding: '1.15rem',
        display: 'flex',
        gap: '1.15rem',
        cursor: onSelectMovie ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        minHeight: '135px'
      }}
      onMouseEnter={(e) => {
        if (onSelectMovie) {
          e.currentTarget.style.borderColor = '#333333';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onSelectMovie) {
          e.currentTarget.style.borderColor = '#1a1a1a';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* 2:3 Movie Poster */}
      {showMoviePoster && review.movie_poster_path && (
        <div style={{ width: '70px', height: '105px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#121212', border: '1px solid #222222' }}>
          <img
            src={getImageUrl(review.movie_poster_path, 'w185')}
            alt={review.movie_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Content Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Movie Title */}
          {showMoviePoster && (
            <h4 style={{
              margin: '0 0 0.4rem 0',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em'
            }}>
              {review.movie_title}
            </h4>
          )}

          {/* User Row + Rating */}
<div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
  <div
    onClick={handleUserClick}
    style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
  >
    <div style={{
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: '#1e1e1e',
      border: '1px solid #2e2e2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7rem',
      fontWeight: 700,
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
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#a3a3a3',
        transition: 'color 0.15s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#a3a3a3')}
    >
      {username}
    </span>
  </div>

            <span style={{ color: '#333333', fontSize: '0.7rem' }}>•</span>
            <StarRating rating={review.rating || 0} interactive={false} size={11} />
          </div>

          {/* Review Text */}
          <p style={{
            margin: 0,
            fontSize: '0.84rem',
            color: '#cccccc',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {review.review_text}
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
          <button
            onClick={handleToggleLike}
            title={liked ? 'Unlike' : 'Like'}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: liked ? '#ef4444' : '#525252',
              cursor: 'pointer',
              padding: '2px 0',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'color 0.15s ease, transform 0.1s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
              title="Delete review"
              style={{
                background: 'none',
                border: 'none',
                color: '#525252',
                cursor: 'pointer',
                padding: '2px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#525252')}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}