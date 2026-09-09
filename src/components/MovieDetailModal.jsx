import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  getMovieDetails,
  getMovieWatchProviders,
  getMovieRecommendations,
  getImageUrl
} from '../services/tmdb';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import {
  X,
  Star,
  Bookmark,
  Send,
  Clock,
  Calendar,
  Share2,
  Check,
  Play,
  Eye,
  Heart,
  Tv,
  Building2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import PersonDetailModal from './PersonDetailModal';
import CompanyDetailModal from './CompanyDetailModal';
import styles from './CSS/MovieDetailModal.module.css';

function MovieDetailModalSkeleton() {
  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '3.5rem 4rem 4rem 4rem' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div
          className="skeleton-box"
          style={{
            width: '230px',
            height: '345px',
            borderRadius: '12px',
            border: '1px solid #1a1a1a',
            flexShrink: 0
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton-box" style={{ width: '55%', height: '40px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '70px', height: '30px', borderRadius: '6px' }} />
          </div>

          <div className="skeleton-box" style={{ width: '220px', height: '18px', borderRadius: '4px', marginBottom: '1.4rem' }} />

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ width: '100px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '65px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '22px', borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', marginBottom: '1.8rem' }}>
            <div className="skeleton-box" style={{ width: '70px', height: '26px', borderRadius: '7px' }} />
            <div className="skeleton-box" style={{ width: '85px', height: '26px', borderRadius: '7px' }} />
            <div className="skeleton-box" style={{ width: '75px', height: '26px', borderRadius: '7px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton-box" style={{ width: '135px', height: '30px', borderRadius: '7px' }} />
            <div className="skeleton-box" style={{ width: '135px', height: '30px', borderRadius: '7px' }} />
            <div className="skeleton-box" style={{ width: '135px', height: '30px', borderRadius: '7px' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2.8rem' }}>
        <div className="skeleton-box" style={{ width: '40%', height: '20px', borderRadius: '6px', marginBottom: '1rem' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '15px', borderRadius: '4px', marginBottom: '0.55rem' }} />
        <div className="skeleton-box" style={{ width: '92%', height: '15px', borderRadius: '4px', marginBottom: '0.55rem' }} />
        <div className="skeleton-box" style={{ width: '65%', height: '15px', borderRadius: '4px' }} />
      </div>

      <div style={{ marginTop: '3.5rem' }}>
        <div className="skeleton-box" style={{ width: '110px', height: '16px', borderRadius: '4px', marginBottom: '1.25rem' }} />
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="skeleton-box" style={{ width: '92px', height: '92px', borderRadius: '50%' }} />
              <div className="skeleton-box" style={{ width: '65px', height: '12px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationMovieCard({ film, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  if (!film) return null;

  return (
    <div
      onClick={() => onSelect(film.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: '150px',
        maxWidth: '150px',
        backgroundColor: '#0a0a0a',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${isHovered ? '#383838' : '#1e1e1e'}`,
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.65)' : 'none',
        flexShrink: 0
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: '#121212' }}>
        <img
          src={getImageUrl(film.poster_path, 'w342')}
          alt={film.title || 'Poster'}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)'
          }}
        />
      </div>

      <div style={{ padding: '0.65rem 0.75rem' }}>
        <h4
          style={{
            fontSize: '0.82rem',
            margin: '0 0 0.25rem 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isHovered ? '#ffffff' : '#e5e5e5',
            fontWeight: 500,
            transition: 'color 0.15s ease'
          }}
        >
          {film.title || 'Untitled'}
        </h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#737373' }}>
          <span>{film.release_date ? film.release_date.split('-')[0] : 'N/A'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#ffffff', fontWeight: 600 }}>
            <Star size={11} fill="#ffffff" />
            {film.vote_average ? film.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MovieDetailModal({ movieId, onClose }) {
  const { user, profile, refreshProfile } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(4.0);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const [watchProviders, setWatchProviders] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const modalContentRef = useRef(null);
  const numericMovieId = Number(movieId);

  useEffect(() => {
    if (!numericMovieId) return;

    let isMounted = true;
    setMovie(null);
    setWatchProviders(null);
    setRecommendations([]);
    setReviews([]);
    setIsWatched(false);
    setInWatchlist(false);
    setLoading(true);

    if (modalContentRef.current) modalContentRef.current.scrollTop = 0;

    async function loadData() {
      try {
        const [details, providersData, recsData, revResponse, listResponse] = await Promise.all([
          getMovieDetails(numericMovieId),
          getMovieWatchProviders(numericMovieId),
          getMovieRecommendations(numericMovieId),
          supabase
            .from('reviews')
            .select('*, profiles(username, avatar_url), review_likes(user_id)')
            .eq('tmdb_movie_id', numericMovieId)
            .order('created_at', { ascending: false }),
          user
            ? supabase
                .from('watchlists')
                .select('id, type')
                .eq('user_id', user.id)
                .eq('tmdb_movie_id', numericMovieId)
            : Promise.resolve({ data: [] })
        ]);

        if (!isMounted) return;

        setMovie(details);
        setWatchProviders(
          providersData?.US ||
          providersData?.IN ||
          providersData?.GB ||
          Object.values(providersData || {})[0] ||
          null
        );
        setRecommendations(recsData || []);

        const revData = revResponse?.data || [];
        setReviews(revData);

        if (user) {
          const listData = listResponse?.data || [];
          const hasWatchedRow = listData.some((item) => item.type === 'watched');
          const hasUserReviewed = revData.some((r) => r.user_id === user.id);
          const hasWatchlistRow = listData.some((item) => item.type === 'watchlist' || !item.type);

          const watchedStatus = Boolean(hasWatchedRow || hasUserReviewed);
          setIsWatched(watchedStatus);
          setInWatchlist(!watchedStatus && Boolean(hasWatchlistRow));
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [numericMovieId, user]);

  useEffect(() => {
    const favs = Array.isArray(profile?.favorite_movies) ? profile.favorite_movies : [];
    setIsFavorited(favs.some((m) => m.tmdb_movie_id === numericMovieId));
  }, [profile, numericMovieId]);

  useEffect(() => {
    const handleStatusChange = (e) => {
      const { movieId: updatedId, isWatched: newWatched, reviewDeleted, reviewId: deletedReviewId } = e.detail || {};
      if (Number(updatedId) === numericMovieId) {
        if (typeof newWatched === 'boolean') setIsWatched(newWatched);
        if (reviewDeleted && deletedReviewId) {
          setReviews((prev) => prev.filter((r) => String(r.id) !== String(deletedReviewId)));
        }
      }
    };

    window.addEventListener('unboxd:movie-status-changed', handleStatusChange);
    return () => window.removeEventListener('unboxd:movie-status-changed', handleStatusChange);
  }, [numericMovieId]);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('movie', movieId);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url.toString());
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url.toString();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSelectMovie = (newMovieId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('movie', newMovieId.toString());
    url.searchParams.delete('review');
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  };

  const toggleWatchlist = async () => {
    if (!user) return alert('Please sign in to manage your watchlist.');
    if (inWatchlist) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', numericMovieId)
        .or('type.eq.watchlist,type.is.null');
      setInWatchlist(false);
    } else {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', numericMovieId)
        .eq('type', 'watched');

      await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: numericMovieId,
        movie_title: movie?.title || '',
        movie_poster_path: movie?.poster_path || '',
        type: 'watchlist'
      });
      setInWatchlist(true);

      if (isWatched) {
        setIsWatched(false);
        window.dispatchEvent(
          new CustomEvent('unboxd:movie-status-changed', {
            detail: { movieId: numericMovieId, isWatched: false, reviewDeleted: false }
          })
        );
      }
    }
  };

  const toggleWatched = async () => {
    if (!user) return alert('Please sign in to log watched films.');
    if (isWatched) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', numericMovieId)
        .eq('type', 'watched');

      setIsWatched(false);

      window.dispatchEvent(
        new CustomEvent('unboxd:movie-status-changed', {
          detail: { movieId: numericMovieId, isWatched: false, reviewDeleted: false }
        })
      );
    } else {
      const { error: watchedInsertError } = await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: numericMovieId,
        movie_title: movie?.title || '',
        movie_poster_path: movie?.poster_path || '',
        type: 'watched'
      });

      if (watchedInsertError) {
        console.error('Failed to mark as watched:', watchedInsertError);
        alert(watchedInsertError.message || 'Failed to mark as watched.');
        return;
      }

      setIsWatched(true);

      if (inWatchlist) {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', numericMovieId)
          .or('type.eq.watchlist,type.is.null');
        setInWatchlist(false);
      }

      window.dispatchEvent(
        new CustomEvent('unboxd:movie-status-changed', {
          detail: { movieId: numericMovieId, isWatched: true, reviewDeleted: false }
        })
      );
    }
  };

  const toggleFavorite = async () => {
    if (!user) return alert('Please sign in to manage favorites.');
    const currentFavs = Array.isArray(profile?.favorite_movies) ? profile.favorite_movies : [];
    let updatedFavs;

    if (isFavorited) {
      updatedFavs = currentFavs.filter((m) => m.tmdb_movie_id !== numericMovieId);
    } else {
      if (currentFavs.length >= 4) {
        alert('You can only have 4 favorite films. Remove one from your profile settings first.');
        return;
      }
      updatedFavs = [
        ...currentFavs,
        { tmdb_movie_id: numericMovieId, title: movie?.title || '', poster_path: movie?.poster_path || '' }
      ];
    }

    setSavingFavorite(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_movies: updatedFavs })
        .eq('id', user.id);

      if (error) throw error;

      setIsFavorited(!isFavorited);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to update favorites:', err);
      alert(err.message || 'Failed to update favorites.');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to review.');
    if (!reviewText.trim()) return;

    setSubmitting(true);
    try {
      if (editingReviewId) {
        const { data, error } = await supabase
          .from('reviews')
          .update({
            rating: parseFloat(rating),
            review_text: reviewText,
            contains_spoilers: containsSpoilers
          })
          .eq('id', editingReviewId)
          .select('*, profiles(username, avatar_url), review_likes(user_id)')
          .single();

        if (error) throw error;

        if (data) {
          setReviews((prev) => prev.map((r) => (r.id === editingReviewId ? data : r)));
        }

        setEditingReviewId(null);
        setReviewText('');
        setRating(4.0);
        setContainsSpoilers(false);
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          tmdb_movie_id: numericMovieId,
          movie_title: movie?.title || '',
          movie_poster_path: movie?.poster_path || '',
          rating: parseFloat(rating),
          review_text: reviewText,
          contains_spoilers: containsSpoilers
        })
        .select('*, profiles(username, avatar_url), review_likes(user_id)')
        .single();

      if (error) throw error;

      if (data) {
        setReviews([data, ...reviews]);
        setReviewText('');
        setContainsSpoilers(false);

        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', numericMovieId)
          .or('type.eq.watchlist,type.is.null');

        const { data: existingWatched } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', numericMovieId)
          .eq('type', 'watched')
          .maybeSingle();

        if (!existingWatched) {
          await supabase.from('watchlists').insert({
            user_id: user.id,
            tmdb_movie_id: numericMovieId,
            movie_title: movie?.title || '',
            movie_poster_path: movie?.poster_path || '',
            type: 'watched'
          });
        }

        setIsWatched(true);
        setInWatchlist(false);

        window.dispatchEvent(
          new CustomEvent('unboxd:movie-status-changed', {
            detail: { movieId: numericMovieId, isWatched: true, reviewDeleted: false }
          })
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (!error) {
      setReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setReviewText('');
        setRating(4.0);
        setContainsSpoilers(false);
      }
      window.dispatchEvent(
        new CustomEvent('unboxd:movie-status-changed', {
          detail: { movieId: numericMovieId, reviewDeleted: true, reviewId }
        })
      );
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating || 0);
    setReviewText(review.review_text || '');
    setContainsSpoilers(Boolean(review.contains_spoilers));
    const formEl = document.getElementById('review-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setReviewText('');
    setRating(4.0);
    setContainsSpoilers(false);
  };

  if (!movieId) return null;

  const communityAverage = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const posterSrc = movie ? getImageUrl(movie.poster_path, 'w500') : '';
  const backdropSrc = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, 'w1280') : null;
  const director = movie?.credits?.crew?.find((c) => c.job === 'Director')?.name;
  const topCast = movie?.credits?.cast?.slice(0, 12) || [];
  const studios = movie?.production_companies || [];

  const streamProviders = watchProviders?.flatrate || watchProviders?.ads || [];
  const rentBuyProviders = [
    ...(watchProviders?.rent || []),
    ...(watchProviders?.buy || [])
  ];
  const uniqueRentBuy = Array.from(new Map(rentBuyProviders.map((p) => [p.provider_id, p])).values());

  const videos = movie?.videos?.results || [];
  const youtubeTrailers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const trailer =
    youtubeTrailers.find((v) => /\b(official trailer|main trailer)\b/i.test(v.name)) ||
    youtubeTrailers.find((v) => !/\b(teaser|clip|spot|sneak|featurette|promo|announcement)\b/i.test(v.name)) ||
    youtubeTrailers[0] ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  return (
    <div onClick={onClose} className={styles.backdrop}>
      <div ref={modalContentRef} onClick={(e) => e.stopPropagation()} className={styles.modal}>
        {backdropSrc && (
          <div className={styles.backdropImage} style={{ backgroundImage: `url(${backdropSrc})` }} />
        )}

        <div className={styles.topControls}>
          {copied && (
            <div className={styles.copiedBadge}>
              <Check size={13} color="#22c55e" />
              <span>Link copied</span>
            </div>
          )}

          <button onClick={handleShare} title="Copy link" className={styles.controlBtn}>
            <Share2 size={15} />
          </button>
          <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <MovieDetailModalSkeleton />
        ) : movie ? (
          <div className={styles.contentWrapper}>
            {/* Header Hero */}
            <div className={styles.hero}>
              <img src={posterSrc} alt={movie.title} className={styles.poster} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.titleArea}>
                  <h1 className={styles.movieTitle}>{movie.title}</h1>
                  <span className={styles.releaseYear}>{movie.release_date?.split('-')[0]}</span>
                </div>

                {/* Director & Studios */}
                <div className={styles.creditsRow}>
                  {director && (
                    <p className={styles.directorText}>
                      Directed by{' '}
                      <span
                        onClick={() => {
                          const dirObj = movie?.credits?.crew?.find((c) => c.job === 'Director');
                          if (dirObj) setSelectedPersonId(dirObj.id);
                        }}
                        className={styles.directorLink}
                      >
                        {director}
                      </span>
                    </p>
                  )}

                  {studios.length > 0 && (
                    <>
                      {director && <span style={{ color: '#333333' }}>•</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <Building2 size={14} color="#8a8a8a" />
                        <span style={{ fontSize: '0.88rem', color: '#8a8a8a' }}>Studio:</span>
                        {studios.slice(0, 3).map((comp, idx) => (
                          <span
                            key={comp.id}
                            onClick={() => setSelectedCompanyId(comp.id)}
                            className={styles.studioLink}
                          >
                            {comp.name}
                            {idx < Math.min(studios.length, 3) - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Rating & Metadata Row with Community Score */}
                <div className={styles.ratingsRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem' }}>
                      <Star size={16} fill="#ffffff" />
                      {communityAverage ? `${communityAverage} / 5` : 'No ratings'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#8a8a8a', fontWeight: 500 }}>
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

                  <span style={{ color: '#333333' }}>•</span>

                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e5e5e5', fontWeight: 600, fontSize: '0.88rem' }}>
                    TMDB: <strong style={{ color: '#ffffff' }}>{movie.vote_average ? movie.vote_average.toFixed(1) : '-'}</strong>/10
                  </span>

                  {movie.runtime > 0 && (
                    <>
                      <span style={{ color: '#333333' }}>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={15} />
                        {movie.runtime}m
                      </span>
                    </>
                  )}

                  <span style={{ color: '#333333' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={15} />
                    {movie.release_date || 'N/A'}
                  </span>
                </div>

                {/* Genre Pills */}
                <div className={styles.genrePills}>
                  {movie.genres?.map((g) => (
                    <span key={g.id} className={styles.genrePill}>
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.actionsGroup}>
                  <button
                    onClick={toggleWatched}
                    className={`${styles.actionBtn} ${isWatched ? styles.actionBtnActive : ''}`}
                  >
                    <Eye size={14} />
                    <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
                  </button>

                  <button
                    onClick={toggleWatchlist}
                    className={`${styles.actionBtn} ${inWatchlist ? styles.actionBtnActive : ''}`}
                  >
                    <Bookmark size={14} fill={inWatchlist ? '#000000' : 'none'} />
                    <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                  </button>

                  <button
                    onClick={toggleFavorite}
                    disabled={savingFavorite}
                    className={`${styles.actionBtn} ${isFavorited ? styles.actionBtnActive : ''}`}
                    style={{ cursor: savingFavorite ? 'not-allowed' : 'pointer', opacity: savingFavorite ? 0.6 : 1 }}
                  >
                    <Heart size={14} fill={isFavorited ? '#000000' : 'none'} />
                    <span>{isFavorited ? 'In Favorites' : 'Add to Favorites'}</span>
                  </button>

                  {trailer && (
                    <button
                      onClick={() => setIsPlayingTrailer(true)}
                      className={styles.actionBtn}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {movie.tagline && (
              <p className={styles.tagline}>
                "{movie.tagline}"
              </p>
            )}

            <p className={styles.overview}>
              {movie.overview || 'No description available.'}
            </p>

            {/* Watch Providers Section */}
            {(streamProviders.length > 0 || uniqueRentBuy.length > 0) && (
              <div className={styles.watchProvidersCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
                  <Tv size={16} color="#ffffff" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', textTransform: 'uppercase' }}>
                    Where to Watch
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                  {streamProviders.length > 0 && (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#8a8a8a', marginBottom: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Stream
                      </span>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {streamProviders.map((prov) => (
                          <div
                            key={prov.provider_id}
                            title={prov.provider_name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #282828', background: '#0a0a0a' }}
                          >
                            <img src={getImageUrl(prov.logo_path, 'w92')} alt={prov.provider_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uniqueRentBuy.length > 0 && (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#8a8a8a', marginBottom: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Rent / Buy
                      </span>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {uniqueRentBuy.slice(0, 8).map((prov) => (
                          <div
                            key={prov.provider_id}
                            title={prov.provider_name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #282828', background: '#0a0a0a' }}
                          >
                            <img src={getImageUrl(prov.logo_path, 'w92')} alt={prov.provider_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cast Carousel */}
            {topCast.length > 0 && (
              <div style={{ marginTop: '3.5rem' }}>
                <span className={styles.sectionHeading}>
                  Top Cast
                </span>
                <div className={styles.carouselTrack}>
                  {topCast.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => setSelectedPersonId(actor.id)}
                      className={styles.castCard}
                    >
                      <div className={styles.castAvatarWrap}>
                        {actor.profile_path ? (
                          <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252', fontSize: '0.9rem' }}>N/A</div>
                        )}
                      </div>
                      <p className={styles.castName}>{actor.name}</p>
                      <p className={styles.castRole}>{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Films Carousel */}
            {recommendations.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
                  <Sparkles size={15} color="#ffffff" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Recommended Films
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                  {recommendations.map((rec) => (
                    <RecommendationMovieCard
                      key={rec.id}
                      film={rec}
                      onSelect={handleSelectMovie}
                    />
                  ))}
                </div>
              </div>
            )}

            <hr style={{ borderColor: '#1f1f1f', margin: '3.5rem 0' }} />

            {/* Add Review Form */}
            <div id="review-form" style={{ marginBottom: '4rem', width: '100%' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {editingReviewId ? 'Edit Review' : 'Add Review'}
              </h3>

              {user ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                    <StarRating rating={rating} onChange={(val) => setRating(val)} size={28} />
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', minWidth: '50px' }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <div style={{ position: 'relative', width: '100%' }}>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      placeholder="Write your review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#111111',
                        border: '1px solid #2a2a2a',
                        borderRadius: '10px',
                        padding: '16px 18px 26px 18px',
                        color: '#ffffff',
                        fontSize: '1.05rem',
                        lineHeight: '1.6',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />

                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: reviewText.length >= 950 ? '#ef4444' : '#666666'
                      }}
                    >
                      {reviewText.length} / 1000
                    </span>
                  </div>

                  {/* Contains Spoilers Checkbox */}
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: containsSpoilers ? '#ffffff' : '#a3a3a3',
                      userSelect: 'none',
                      width: 'fit-content'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={containsSpoilers}
                      onChange={(e) => setContainsSpoilers(e.target.checked)}
                      style={{
                        accentColor: '#ffffff',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {containsSpoilers && <AlertTriangle size={14} color="#eab308" />}
                      Contains spoilers
                    </span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '10px 24px',
                        background: '#ffffff',
                        border: '1px solid #ffffff',
                        borderRadius: '8px',
                        color: '#000000',
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1,
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      <Send size={16} /> {submitting ? (editingReviewId ? 'Updating...' : 'Posting...') : (editingReviewId ? 'Update Review' : 'Post Review')}
                    </button>

                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#a3a3a3',
                          fontSize: '0.98rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p style={{ color: '#737373', fontSize: '1.05rem' }}>Sign in to rate or review.</p>
              )}
            </div>

            {/* 3-Column Reviews Grid */}
            <div style={{ width: '100%' }}>
              <h3 style={{ margin: '0 0 1.75rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: '#737373', fontSize: '1.05rem' }}>No reviews yet.</p>
              ) : (
                <div className={styles.reviewsGrid}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      id={`review-${rev.id}`}
                      style={{
                        width: '100%',
                        borderRadius: '14px',
                        border: '1px solid transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ReviewCard
                        review={rev}
                        onDelete={handleDeleteReview}
                        onEdit={user?.id === rev.user_id ? handleEditReview : undefined}
                        showMoviePoster={false}
                        onCloseModal={onClose}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Embedded Trailer Overlay */}
        {isPlayingTrailer && trailer && (
          <div
            onClick={() => setIsPlayingTrailer(false)}
            className={styles.trailerBackdrop}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={styles.trailerBox}
            >
              <button
                onClick={() => setIsPlayingTrailer(false)}
                aria-label="Close trailer"
                className={styles.trailerCloseBtn}
              >
                <X size={20} />
              </button>

              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
                title={`${movie.title} Trailer`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Person Modal Overlay */}
        {selectedPersonId && (
          <PersonDetailModal
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
            onSelectMovie={(newMovieId) => {
              setSelectedPersonId(null);
              handleSelectMovie(newMovieId);
            }}
          />
        )}

        {/* Studio / Production Company Modal Overlay */}
        {selectedCompanyId && (
          <CompanyDetailModal
            companyId={selectedCompanyId}
            onClose={() => setSelectedCompanyId(null)}
            onSelectMovie={(newMovieId) => {
              setSelectedCompanyId(null);
              handleSelectMovie(newMovieId);
            }}
          />
        )}
      </div>
    </div>
  );
}