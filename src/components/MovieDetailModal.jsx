import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getMovieDetails, getImageUrl } from '../services/tmdb';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import { X, Star, Bookmark, Send, Clock, Calendar, Share2, Check, Play, Eye } from 'lucide-react';
import PersonDetailModal from './PersonDetailModal';

export default function MovieDetailModal({ movieId, onClose }) {
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(4.0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  // 1. Primary Data Fetching Effect
  useEffect(() => {
    if (!movieId) return;

    async function loadData() {
      setLoading(true);
      try {
        const details = await getMovieDetails(movieId);
        setMovie(details);

        const { data: revData } = await supabase
          .from('reviews')
          .select('*, profiles(username, avatar_url), review_likes(user_id)')
          .eq('tmdb_movie_id', movieId)
          .order('created_at', { ascending: false });

        setReviews(revData || []);

        if (user) {
          const { data: listData } = await supabase
            .from('watchlists')
            .select('id, type')
            .eq('user_id', user.id)
            .eq('tmdb_movie_id', movieId);

          if (listData) {
            setInWatchlist(listData.some((item) => item.type === 'watchlist' || !item.type));
            setIsWatched(listData.some((item) => item.type === 'watched'));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId, user]);

  // 2. Auto-scroll to review if ?review=<id> is in URL (Hook must sit at component level)
  useEffect(() => {
    if (loading || reviews.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const targetReviewId = params.get('review');
    if (!targetReviewId) return;

    const timer = setTimeout(() => {
      const targetElement = document.getElementById(`review-${targetReviewId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        targetElement.style.borderColor = '#38bdf8';
        targetElement.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.35)';

        setTimeout(() => {
          targetElement.style.borderColor = 'transparent';
          targetElement.style.boxShadow = 'none';
        }, 2200);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [loading, reviews]);

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
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', movieId)
        .or('type.eq.watchlist,type.is.null');
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

  const toggleWatched = async () => {
    if (!user) return alert('Please sign in to log watched films.');

    if (isWatched) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', movieId)
        .eq('type', 'watched');
      setIsWatched(false);
    } else {
      await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: movie.id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        type: 'watched'
      });
      setIsWatched(true);

      if (inWatchlist) {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', movieId)
          .or('type.eq.watchlist,type.is.null');
        setInWatchlist(false);
      }
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
      .select('*, profiles(username, avatar_url), review_likes(user_id)')
      .single();

    if (!error && data) {
      setReviews([data, ...reviews]);
      setReviewText('');

      if (!isWatched) {
        await supabase.from('watchlists').insert({
          user_id: user.id,
          tmdb_movie_id: movie.id,
          movie_title: movie.title,
          movie_poster_path: movie.poster_path,
          type: 'watched'
        });
        setIsWatched(true);
      }
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

  const videos = movie?.videos?.results || [];
  const youtubeTrailers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const trailer =
    youtubeTrailers.find((v) => /\b(official trailer|main trailer)\b/i.test(v.name)) ||
    youtubeTrailers.find((v) => !/\b(teaser|clip|spot|sneak|featurette|promo|announcement)\b/i.test(v.name)) ||
    youtubeTrailers[0] ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          background: '#0a0a0a',
          width: '100%',
          maxWidth: '1380px',
          maxHeight: '94vh',
          borderRadius: '18px',
          overflowY: 'auto',
          border: '1px solid #222222',
          color: '#ffffff',
          position: 'relative',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.98)'
        }}
      >
        {backdropSrc && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '620px',
              backgroundImage: `url(${backdropSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              opacity: 0.38,
              filter: 'brightness(1.05)',
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)',
              zIndex: 0
            }}
          />
        )}

        {/* Top Controls */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '0.85rem', zIndex: 30 }}>
          <button
            onClick={handleShare}
            title="Copy share link"
            style={{
              background: 'rgba(18, 18, 18, 0.9)',
              border: `1px solid ${copied ? '#22c55e' : '#2a2a2a'}`,
              color: copied ? '#22c55e' : '#e5e5e5',
              borderRadius: '9px',
              padding: '0 16px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(18, 18, 18, 0.9)',
              border: '1px solid #2a2a2a',
              color: '#8a8a8a',
              borderRadius: '9px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#404040';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8a8a8a';
              e.currentTarget.style.borderColor = '#2a2a2a';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '12rem 2rem', color: '#737373', fontSize: '1.15rem' }}>
            Loading film details...
          </div>
        ) : movie ? (
          <div style={{ position: 'relative', zIndex: 1, padding: '4.5rem 5rem 5rem 5rem' }}>
            {/* Header Hero */}
            <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start' }}>
              <img
                src={posterSrc}
                alt={movie.title}
                style={{
                  width: '310px',
                  borderRadius: '14px',
                  border: '1px solid #282828',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
                  display: 'block',
                  flexShrink: 0
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1 }}>
                    {movie.title}
                  </h1>
                  <span style={{ fontSize: '1.7rem', color: '#737373', fontWeight: 400 }}>
                    {movie.release_date?.split('-')[0]}
                  </span>
                </div>

                {director && (
                  <p style={{ margin: '0.8rem 0 1.5rem 0', fontSize: '1.1rem', color: '#a3a3a3' }}>
                    Directed by{' '}
                    <span
                      onClick={() => {
                        const dirObj = movie?.credits?.crew?.find((c) => c.job === 'Director');
                        if (dirObj) setSelectedPersonId(dirObj.id);
                      }}
                      style={{ color: '#ffffff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      {director}
                    </span>
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', color: '#a3a3a3', fontSize: '1.02rem', marginBottom: '1.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontWeight: 800, fontSize: '1.1rem' }}>
                    <Star size={18} fill="#22c55e" />
                    {movie.vote_average ? movie.vote_average.toFixed(1) : '-'} / 10
                  </span>
                  {movie.runtime > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={17} />
                      {movie.runtime}m
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={17} />
                    {movie.release_date || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {movie.genres?.map((g) => (
                    <span
                      key={g.id}
                      style={{
                        background: 'rgba(18, 18, 18, 0.9)',
                        border: '1px solid #2a2a2a',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: 'fit-content', minWidth: '180px' }}>
                  <button
                    onClick={toggleWatched}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isWatched ? '#22c55e' : 'rgba(18, 18, 18, 0.9)',
                      color: isWatched ? '#000000' : '#ffffff',
                      border: `1px solid ${isWatched ? '#22c55e' : '#2a2a2a'}`,
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Eye size={16} />
                    <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
                  </button>

                  <button
                    onClick={toggleWatchlist}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: inWatchlist ? '#ffffff' : 'rgba(18, 18, 18, 0.9)',
                      color: inWatchlist ? '#000000' : '#ffffff',
                      border: `1px solid ${inWatchlist ? '#ffffff' : '#2a2a2a'}`,
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Bookmark size={16} fill={inWatchlist ? '#000000' : 'none'} />
                    <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                  </button>

                  {trailer && (
                    <button
                      onClick={() => setIsPlayingTrailer(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {movie.tagline && (
              <p style={{ fontStyle: 'italic', color: '#8a8a8a', fontSize: '1.15rem', marginTop: '3rem', marginBottom: '0.85rem' }}>
                "{movie.tagline}"
              </p>
            )}

            <p style={{ lineHeight: '1.8', color: '#d4d4d4', fontSize: '1.12rem', margin: '0.85rem 0 0 0', maxWidth: '1200px' }}>
              {movie.overview || 'No description available.'}
            </p>

            {/* Cast */}
            {topCast.length > 0 && (
              <div style={{ marginTop: '4rem' }}>
                <span style={{ display: 'block', margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Top Cast
                </span>
                <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1.25rem' }}>
                  {topCast.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => setSelectedPersonId(actor.id)}
                      style={{ minWidth: '125px', maxWidth: '125px', textAlign: 'center', flexShrink: 0, cursor: 'pointer' }}
                    >
                      <div style={{ width: '104px', height: '104px', margin: '0 auto 0.85rem auto', borderRadius: '50%', overflow: 'hidden', background: '#121212', border: '2px solid #282828' }}>
                        {actor.profile_path ? (
                          <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252', fontSize: '1rem' }}>N/A</div>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.98rem', color: '#ffffff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#8a8a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ borderColor: '#1f1f1f', margin: '4rem 0' }} />

            {/* Add Review Form */}
            <div style={{ marginBottom: '4.5rem', width: '100%' }}>
              <h3 style={{ margin: '0 0 1.75rem 0', fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Add Review
              </h3>

              {user ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <StarRating rating={rating} onChange={(val) => setRating(val)} size={32} />
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', minWidth: '55px' }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    placeholder="Write your review..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      padding: '20px 22px',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      lineHeight: '1.6',
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
                      gap: '0.75rem',
                      padding: '12px 28px',
                      background: '#ffffff',
                      border: '1px solid #ffffff',
                      borderRadius: '8px',
                      color: '#000000',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    <Send size={18} /> {submitting ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#737373', fontSize: '1.15rem' }}>Sign in to rate or review.</p>
              )}
            </div>

            {/* Reviews List with target element id */}
            <div style={{ width: '100%' }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: '#737373', fontSize: '1.15rem' }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      id={`review-${rev.id}`}
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ReviewCard
                        review={rev}
                        onDelete={handleDeleteReview}
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
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.96)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1080px',
                aspectRatio: '16/9',
                background: '#000000',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid #282828',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.98)'
              }}
            >
              <button
                onClick={() => setIsPlayingTrailer(false)}
                aria-label="Close trailer"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid #383838',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#222222')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)')}
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

        {/* Independent Person Modal Overlay */}
        {selectedPersonId && (
          <PersonDetailModal
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
            onSelectMovie={(newMovieId) => {
              setSelectedPersonId(null);
              onClose();
              const url = new URL(window.location.href);
              url.searchParams.set('movie', newMovieId);
              window.history.pushState({}, '', url);
              window.dispatchEvent(new Event('popstate'));
            }}
          />
        )}
      </div>
    </div>
  );
}