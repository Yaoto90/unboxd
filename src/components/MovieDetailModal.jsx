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

  const posterSrc = movie ? getImageUrl(movie.poster_path) : '';
  const backdropSrc = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, 'original') : null;
  const director = movie?.credits?.crew?.find((c) => c.job === 'Director')?.name;
  const topCast = movie?.credits?.cast?.slice(0, 8) || [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '1.5rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          borderRadius: '12px',
          overflowY: 'auto',
          border: '1px solid #27272a',
          color: '#ffffff',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)'
        }}
      >
        {backdropSrc && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '420px',
              backgroundImage: `url(${backdropSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              opacity: 0.3,
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)',
              zIndex: 0
            }}
          />
        )}

        {/* Action Controls */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 30 }}>
          <button
            onClick={handleShare}
            title="Copy share link"
            style={{
              background: 'rgba(24, 24, 27, 0.75)',
              border: `1px solid ${copied ? '#22c55e' : '#3f3f46'}`,
              color: copied ? '#22c55e' : '#e4e4e7',
              borderRadius: '20px',
              padding: '0 10px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
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
              background: 'rgba(24, 24, 27, 0.75)',
              border: '1px solid #3f3f46',
              color: '#e4e4e7',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#71717a', fontSize: '0.9rem' }}>
            Loading film details...
          </div>
        ) : movie ? (
          <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem 2rem 2rem 2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={posterSrc}
                alt={movie.title}
                style={{
                  width: '160px',
                  borderRadius: '8px',
                  border: '1px solid #3f3f46',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                  display: 'block',
                  flexShrink: 0
                }}
              />

              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    {movie.title}
                  </h1>
                  <span style={{ fontSize: '1.1rem', color: '#a1a1aa', fontWeight: 400 }}>
                    {movie.release_date?.split('-')[0]}
                  </span>
                </div>

                {director && (
                  <p style={{ margin: '0.4rem 0 0.8rem 0', fontSize: '0.85rem', color: '#a1a1aa' }}>
                    Directed by <span style={{ color: '#ffffff', fontWeight: 600 }}>{director}</span>
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 700 }}>
                    <Star size={13} fill="#22c55e" />
                    {movie.vote_average ? movie.vote_average.toFixed(1) : '-'} / 10
                  </span>
                  {movie.runtime > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {movie.runtime}m
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {movie.release_date || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {movie.genres?.map((g) => (
                    <span
                      key={g.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid #27272a',
                        color: '#d4d4d8',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <button
                  onClick={toggleWatchlist}
                  className={inWatchlist ? 'btn-minimal-primary' : 'btn-minimal-ghost'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Bookmark size={14} fill={inWatchlist ? '#000000' : 'none'} />
                  {inWatchlist ? 'In Watchlist' : 'Watchlist'}
                </button>
              </div>
            </div>

            {movie.tagline && (
              <p style={{ fontStyle: 'italic', color: '#71717a', fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                "{movie.tagline}"
              </p>
            )}

            <p style={{ lineHeight: '1.6', color: '#d4d4d8', fontSize: '0.9rem', margin: '0.75rem 0 0 0' }}>
              {movie.overview || 'No description available.'}
            </p>

            {topCast.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <span style={{ display: 'block', margin: '0 0 0.8rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#71717a', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Cast
                </span>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {topCast.map((actor) => (
                    <div key={actor.id} style={{ minWidth: '75px', maxWidth: '75px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ width: '52px', height: '52px', margin: '0 auto 0.4rem auto', borderRadius: '50%', overflow: 'hidden', background: '#18181b', border: '1px solid #27272a' }}>
                        {actor.profile_path ? (
                          <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: '0.7rem' }}>N/A</div>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</p>
                      <p style={{ margin: '1px 0 0 0', fontSize: '0.65rem', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ borderColor: '#1f1f23', margin: '2rem 0' }} />

            {/* Add Review */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#ffffff' }}>Add Review</h3>

              {user ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StarRating rating={rating} onChange={(val) => setRating(val)} size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', minWidth: '35px' }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Write your review..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      background: '#111111',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-minimal-primary"
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Send size={12} /> {submitting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#52525b', fontSize: '0.85rem' }}>Sign in to rate or review.</p>
              )}
            </div>

            {/* Movie Reviews list using ReviewCard */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#ffffff' }}>
                Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: '#52525b', fontSize: '0.85rem' }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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