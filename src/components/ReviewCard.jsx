import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import { Heart, Trash2, Pencil, EyeOff, Eye } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';
import styles from './CSS/ReviewCard.module.css';

export default function ReviewCard({
  review,
  onSelectMovie,
  onDelete,
  onEdit,
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
  const [revealedSpoiler, setRevealedSpoiler] = useState(!review.contains_spoilers);

  useEffect(() => {
    setLiked(review.review_likes?.some((l) => l.user_id === user?.id) || false);
    setLikeCount(review.review_likes?.length || 0);
    setRevealedSpoiler(!review.contains_spoilers);
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

  const profileData = Array.isArray(review.profiles)
    ? review.profiles[0]
    : review.profiles || {};

  const username = profileData.username || review.username || 'user';
  const avatarUrl = profileData.avatar_url || review.avatar_url || null;
  const initial = username.charAt(0).toUpperCase();

  const handleUserClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onCloseModal === 'function') {
      onCloseModal();
    }

    const isCurrentUser = Boolean(user && review.user_id === user.id);
    if (isCurrentUser) {
      navigate('/profile');
    } else if (username && username !== 'user') {
      navigate(`/user/${username}`);
    }
  };

  const hasSpoiler = Boolean(review.contains_spoilers && !revealedSpoiler);

  return (
    <div
      onClick={() => onSelectMovie && onSelectMovie(review.tmdb_movie_id, review.id)}
      className={`${styles.card} ${showMoviePoster ? styles.feedMode : styles.modalMode} ${onSelectMovie ? styles.cardInteractive : ''}`}
    >
      {showMoviePoster && review.movie_poster_path && (
        <div className={styles.posterWrap}>
          <img
            src={getImageUrl(review.movie_poster_path, 'w185')}
            alt={review.movie_title || 'Film'}
            className={styles.posterImg}
          />
        </div>
      )}

      <div className={styles.mainBody}>
        {showMoviePoster && (
          <h4 className={styles.movieTitle}>{review.movie_title}</h4>
        )}

        <div className={styles.userRow}>
          <div onClick={handleUserClick} className={styles.userInfo}>
            <div className={styles.avatarCircle}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className={styles.avatarImg}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className={styles.username}>{username}</span>
          </div>

          <StarRating rating={review.rating || 0} interactive={false} size={14} />
        </div>

        <div className={styles.textSection}>
          {hasSpoiler ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setRevealedSpoiler(true);
              }}
              className={styles.spoilerBanner}
            >
              <EyeOff size={18} color="#8a8a8a" style={{ marginBottom: '4px' }} />
              <span className={styles.spoilerTitle}>Contains Spoilers</span>
              <span className={styles.spoilerSubtitle}>Tap to reveal</span>
            </div>
          ) : (
            <div className={showMoviePoster ? styles.scrollTextBoxFeed : styles.scrollTextBox}>
              <p className={styles.reviewText}>{review.review_text}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          onClick={handleToggleLike}
          title={liked ? 'Unlike' : 'Like'}
          className={`${styles.likeBtn} ${liked ? styles.liked : styles.unliked}`}
        >
          <Heart size={14} fill={liked ? '#ef4444' : 'transparent'} />
          <span>{likeCount}</span>
        </button>

        <div className={styles.actionsRight}>
          {review.contains_spoilers && revealedSpoiler && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealedSpoiler(false);
              }}
              title="Hide spoilers again"
              className={styles.hideBtn}
            >
              <Eye size={13} />
              <span>Hide</span>
            </button>
          )}

          {user?.id === review.user_id && (
            <>
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(review);
                  }}
                  title="Edit review"
                  className={styles.iconBtn}
                >
                  <Pencil size={14} />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(review.id);
                  }}
                  title="Delete review"
                  className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}