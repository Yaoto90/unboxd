import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getMovieDetails, getImageUrl } from '../services/tmdb';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import { X, Star, Bookmark, Send, Clock, Calendar, Share2, Check } from 'lucide-react';

export default function MovieDetailModal({ movieId, onClose }) {
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(4.0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!movieId) return;

    async function loadData() {
      setLoading(true);
      try {
        const details = await getMovieDetails(movieId);
        setMovie(details);

        const { data: revData } = await supabase
          .from('reviews')
          .select('*, profiles(username), review_likes(user_id)')
          .eq('tmdb_movie_id', movieId)
          .order('created_at', { ascending: false });

        setReviews(revData || []);

        if (user) {
          const { data: watchData } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('tmdb_movie_id', movieId)
            .maybeSingle();

          setInWatchlist(!!watchData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId, user]);

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

  const toggleWatchlist = async () => {
    if (!user) return alert('Please sign in to manage your watchlist.');

    if (inWatchlist) {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', movieId);
      setInWatchlist(false);
    } else {
      await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: movie.id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        type: 'watchlist'
      });
      setInWatchlist(true);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to review.');
    if (!reviewText.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        tmdb_movie_id: movie.id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        rating: parseFloat(rating),
        review_text: reviewText
      })
      .select('*, profiles(username), review_likes(user_id)')
      .single();

    if (!error && data) {
      setReviews([data, ...reviews]);
      setReviewText('');
    } else if (error) {
      alert(error.message);
    }
    setSubmitting(false);
  };

  const handleDeleteReview = async (reviewId) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (!error) {
      setReviews(reviews.filter((r) => r.id !== reviewId));
    }
  };

  if (!movieId) return null;

  const posterSrc = movie ? getImageUrl(movie.poster_path, 'w500') : '';
  const backdropSrc = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, 'original') : null;
  const director = movie?.credits?.crew?.find((c) => c.job === 'Director')?.name;
  const topCast = movie?.credits?.cast?.slice(0, 12) || [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '2rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0c',
          width: '100%',
          maxWidth: '1280px',
          maxHeight: '94vh',
          borderRadius: '16px',
          overflowY: 'auto',
          border: '1px solid #1f1f23',
          color: '#ffffff',
          position: 'relative',
          boxShadow: '0 35px 90px rgba(0, 0, 0, 0.98)'
        }}
      >
        {backdropSrc && (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '560px',
      backgroundImage: `url(${backdropSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      opacity: 0.42,
      filter: 'brightness(1.02)',
      pointerEvents: 'none',
      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
      zIndex: 0
    }}
  />
)}

        {/* Action Controls */}
        <div style={{ position: 'absolute', top: '1.75rem', right: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 30 }}>
          <button
            onClick={handleShare}
            title="Copy share link"
            style={{
              background: 'rgba(20, 20, 23, 0.85)',
              border: `1px solid ${copied ? '#22c55e' : '#27272a'}`,
              color: copied ? '#22c55e' : '#e4e4e7',
              borderRadius: '8px',
              padding: '0 14px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
              backdropFilter: 'blur(6px)',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(20, 20, 23, 0.85)',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#3f3f46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.borderColor = '#27272a';
            }}
          >
            <X size={17} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem 2rem', color: '#71717a', fontSize: '1rem' }}>
            Loading film details...
          </div>
        ) : movie ? (
          <div style={{ position: 'relative', zIndex: 1, padding: '3.5rem 4rem 4rem 4rem' }}>
            {/* Header Hero */}
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
              <img
                src={posterSrc}
                alt={movie.title}
                style={{
                  width: '240px',
                  borderRadius: '12px',
                  border: '1px solid #27272a',
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.9)',
                  display: 'block',
                  flexShrink: 0
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.9rem', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                    {movie.title}
                  </h1>
                  <span style={{ fontSize: '1.4rem', color: '#a1a1aa', fontWeight: 400 }}>
                    {movie.release_date?.split('-')[0]}
                  </span>
                </div>

                {director && (
                  <p style={{ margin: '0.6rem 0 1.25rem 0', fontSize: '0.95rem', color: '#d4d4d8' }}>
                    Directed by <span style={{ color: '#ffffff', fontWeight: 600 }}>{director}</span>
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', color: '#d4d4d8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e', fontWeight: 700 }}>
                    <Star size={15} fill="#22c55e" />
                    {movie.vote_average ? movie.vote_average.toFixed(1) : '-'} / 10
                  </span>
                  {movie.runtime > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={15} />
                      {movie.runtime}m
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={15} />
                    {movie.release_date || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {movie.genres?.map((g) => (
                    <span
                      key={g.id}
                      style={{
                        background: 'rgba(20, 20, 23, 0.75)',
                        border: '1px solid #27272a',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <button
                  onClick={toggleWatchlist}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: inWatchlist ? '#ffffff' : 'rgba(20, 20, 23, 0.85)',
                    color: inWatchlist ? '#000000' : '#ffffff',
                    border: `1px solid ${inWatchlist ? '#ffffff' : '#27272a'}`,
                    backdropFilter: 'blur(6px)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Bookmark size={15} fill={inWatchlist ? '#000000' : 'none'} />
                  {inWatchlist ? 'In Watchlist' : 'Watchlist'}
                </button>
              </div>
            </div>

            {movie.tagline && (
              <p style={{ fontStyle: 'italic', color: '#a1a1aa', fontSize: '1rem', marginTop: '2.5rem', marginBottom: '0.75rem' }}>
                "{movie.tagline}"
              </p>
            )}

            <p style={{ lineHeight: '1.75', color: '#e4e4e7', fontSize: '1rem', margin: '0.75rem 0 0 0', maxWidth: '1100px' }}>
              {movie.overview || 'No description available.'}
            </p>

            {/* Cast Section */}
            {topCast.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <span style={{ display: 'block', margin: '0 0 1.25rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Cast
                </span>
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                  {topCast.map((actor) => (
                    <div key={actor.id} style={{ minWidth: '100px', maxWidth: '100px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ width: '72px', height: '72px', margin: '0 auto 0.6rem auto', borderRadius: '50%', overflow: 'hidden', background: '#141417', border: '1px solid #232328' }}>
                        {actor.profile_path ? (
                          <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '0.8rem' }}>N/A</div>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#ffffff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ borderColor: '#1f1f23', margin: '3rem 0' }} />

            {/* Add Review Form */}
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>Add Review</h3>

              {user ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '960px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <StarRating rating={rating} onChange={(val) => setRating(val)} size={22} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', minWidth: '40px' }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Write your review..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#121215',
                      border: '1px solid #232328',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '10px 22px',
                      background: '#ffffff',
                      border: '1px solid #ffffff',
                      borderRadius: '8px',
                      color: '#000000',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    <Send size={14} /> {submitting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#71717a', fontSize: '0.95rem' }}>Sign in to rate or review.</p>
              )}
            </div>

            {/* Reviews List */}
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '0.95rem' }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {reviews.map((rev) => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      onDelete={handleDeleteReview}
                      showMoviePoster={false}
                      onCloseModal={onClose}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}