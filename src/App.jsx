import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MovieDetailModal from './components/MovieDetailModal';
import AuthModal from './components/AuthModal';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SearchBrowseModal from './components/SearchBrowseModal';
import ReviewCard from './components/ReviewCard';
import { supabase } from './supabaseClient';
import {
  getTrendingMoviesWeek,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getImageUrl
} from './services/tmdb';
import { Star, Search, Flame, Film, Clock, MessageSquareQuote, Bookmark } from 'lucide-react';
import PublicProfilePage from './pages/PublicProfilePage';

function MovieCard({ movie, onSelect, isWatchlisted, onToggleWatchlist }) {
  const [isHovered, setIsHovered] = useState(false);
  if (!movie) return null;

  return (
    <div
      onClick={() => onSelect(movie.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#0a0a0a',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${isHovered ? '#383838' : '#1e1e1e'}`,
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.65)' : 'none',
        position: 'relative'
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: '#121212' }}>
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title || 'Poster'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)'
          }}
        />

        {/* Quick-Watchlist Button: Visible strictly on hover */}
        {onToggleWatchlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie);
            }}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: isWatchlisted ? '#ffffff' : 'rgba(10, 10, 10, 0.85)',
              border: `1px solid ${isWatchlisted ? '#ffffff' : '#262626'}`,
              color: isWatchlisted ? '#000000' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1)' : 'scale(0.85)',
              pointerEvents: isHovered ? 'auto' : 'none',
              transition: 'opacity 0.15s ease, transform 0.15s ease, background 0.15s ease',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
          >
            <Bookmark size={14} fill={isWatchlisted ? '#000000' : 'none'} />
          </button>
        )}
      </div>

      <div style={{ padding: '0.75rem 0.85rem' }}>
        <h3 style={{
          fontSize: '0.9rem',
          margin: '0 0 0.35rem 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isHovered ? '#ffffff' : '#e5e5e5',
          fontWeight: 500,
          transition: 'color 0.15s ease'
        }}>
          {movie.title || 'Untitled'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#737373' }}>
          <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontWeight: 600 }}>
            <Star size={13} fill="#ffffff" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

function HomeFeed({ onSelectMovie, onOpenAuth }) {
  const { user } = useAuth();
  const [activeFeed, setActiveFeed] = useState('trending'); // 'trending' | 'top_rated' | 'now_playing' | 'upcoming'
  const [movies, setMovies] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [recentReviews, setRecentReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch active watchlist for current user
  useEffect(() => {
    async function loadWatchlist() {
      if (!user) {
        setWatchlistIds(new Set());
        return;
      }
      try {
        const { data } = await supabase
          .from('watchlists')
          .select('tmdb_movie_id')
          .eq('user_id', user.id);

        if (data) {
          setWatchlistIds(new Set(data.map((item) => Number(item.tmdb_movie_id))));
        }
      } catch (err) {
        console.error('Failed to load watchlist:', err);
      }
    }
    loadWatchlist();
  }, [user]);

  // Fetch community reviews once on mount
  useEffect(() => {
    async function loadCommunityReviews() {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('*, profiles(username), review_likes(user_id)')
          .order('created_at', { ascending: false })
          .limit(6);
        setRecentReviews(data || []);
      } catch (err) {
        console.error('Failed to load community reviews:', err);
      }
    }
    loadCommunityReviews();
  }, []);

  // Fetch feed titles whenever active tab changes
  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError('');
      try {
        let fetcher = getTrendingMoviesWeek;
        if (activeFeed === 'top_rated' && typeof getTopRatedMovies === 'function') {
          fetcher = getTopRatedMovies;
        } else if (activeFeed === 'now_playing' && typeof getNowPlayingMovies === 'function') {
          fetcher = getNowPlayingMovies;
        } else if (activeFeed === 'upcoming' && typeof getUpcomingMovies === 'function') {
          fetcher = getUpcomingMovies;
        }

        const data = await fetcher();
        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load films for this feed');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [activeFeed]);

  // Toggle watchlist logic
  const handleToggleWatchlist = async (movie) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    const movieId = Number(movie.id);
    const isSaved = watchlistIds.has(movieId);

    // Optimistic UI update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(movieId);
      else next.add(movieId);
      return next;
    });

    try {
      if (isSaved) {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', movieId);
      } else {
        await supabase.from('watchlists').insert({
          user_id: user.id,
          tmdb_movie_id: movieId,
          movie_title: movie.title,
          movie_poster_path: movie.poster_path,
          type: 'watchlist'
        });
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      // Revert state if request fails
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(movieId);
        else next.delete(movieId);
        return next;
      });
    }
  };

  const feedTabs = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    { id: 'now_playing', label: 'In Theaters', icon: Film },
    { id: 'upcoming', label: 'Upcoming', icon: Clock }
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 5rem 2rem' }}>
      {/* Feed Filter Bar & Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #1e1e1e',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Switcher Tab Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {feedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFeed === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeed(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isActive ? '#ffffff' : '#0e0e0e',
                  color: isActive ? '#000000' : '#8a8a8a',
                  border: `1px solid ${isActive ? '#ffffff' : '#222222'}`,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#383838';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#8a8a8a';
                    e.currentTarget.style.borderColor = '#222222';
                  }
                }}
              >
                <Icon size={13} color={isActive ? '#000000' : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search & Browse Trigger */}
        <div onClick={() => setIsModalOpen(true)} style={{ position: 'relative', width: '220px', cursor: 'pointer' }}>
          <input
            type="text"
            readOnly
            placeholder="Search & Browse..."
            style={{
              width: '100%',
              padding: '7px 32px 7px 12px',
              background: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#737373' }} />
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#737373', marginTop: '4rem', fontSize: '0.9rem' }}>Loading films...</p>}
      {error && <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '4rem', fontSize: '0.9rem' }}>{error}</p>}
      {!loading && !error && movies.length === 0 && (
        <p style={{ textAlign: 'center', color: '#737373', marginTop: '4rem', fontSize: '0.9rem' }}>No matching films found.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '1.5rem' }}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelectMovie}
              isWatchlisted={watchlistIds.has(Number(movie.id))}
              onToggleWatchlist={handleToggleWatchlist}
            />
          ))}
        </div>
      )}

      {/* Community Review Feed */}
      {!loading && recentReviews.length > 0 && (
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <MessageSquareQuote size={16} color="#737373" />
            <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Recent Community Reviews
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {recentReviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                review={rev}
                onSelectMovie={onSelectMovie}
                showMoviePoster={true}
              />
            ))}
          </div>
        </div>
      )}

      <SearchBrowseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function MainLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, initialMode: 'signin' });
  const selectedMovieId = searchParams.get('movie');

  const handleSelectMovie = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('movie', id.toString());
      return next;
    });
  };

  const handleCloseMovie = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('movie');
      return next;
    });
  };

  const handleOpenAuth = (mode = 'signin') => {
    setAuthModalConfig({ isOpen: true, initialMode: mode });
  };

  const handleCloseAuth = () => {
    setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff' }}>
      <Navbar onOpenAuth={handleOpenAuth} />
      <Routes>
        <Route path="/" element={<HomeFeed onSelectMovie={handleSelectMovie} onOpenAuth={handleOpenAuth} />} />
        <Route path="/search" element={<SearchPage onSelectMovie={handleSelectMovie} />} />
        <Route path="/profile" element={<ProfilePage onSelectMovie={handleSelectMovie} />} />
        <Route path="/user/:username" element={<PublicProfilePage onSelectMovie={handleSelectMovie} />} />
      </Routes>
      <MovieDetailModal
        movieId={selectedMovieId}
        onClose={handleCloseMovie}
      />
      {authModalConfig.isOpen && (
        <AuthModal
          isOpen={authModalConfig.isOpen}
          onClose={handleCloseAuth}
          initialMode={authModalConfig.initialMode}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}