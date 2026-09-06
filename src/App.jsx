import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MovieDetailModal from './components/MovieDetailModal';
import AuthModal from './components/AuthModal';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SearchBrowseModal from './components/SearchBrowseModal';
import ReviewCard from './components/ReviewCard';
import { supabase } from './supabaseClient';
import { getTrendingMoviesWeek, getImageUrl } from './services/tmdb';
import { Star, Search, Flame, MessageSquareQuote } from 'lucide-react';
import PublicProfilePage from './pages/PublicProfilePage';

function MovieCard({ movie, onSelect }) {
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
        border: `1px solid ${isHovered ? 'var(--border-hover, #3b82f6)' : 'var(--border-subtle, #27272a)'}`,
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.65)' : 'none'
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: '#18181b' }}>
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
      </div>

      <div style={{ padding: '0.75rem 0.85rem' }}>
        <h3 style={{
          fontSize: '0.9rem',
          margin: '0 0 0.35rem 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isHovered ? '#ffffff' : '#e4e4e7',
          fontWeight: 500,
          transition: 'color 0.15s ease'
        }}>
          {movie.title || 'Untitled'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary, #71717a)' }}>
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

function HomeFeed({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      setError('');
      try {
        const [trendingData, { data: reviewsData }] = await Promise.all([
          getTrendingMoviesWeek(),
          supabase
            .from('reviews')
            .select('*, profiles(username), review_likes(user_id)')
            .order('created_at', { ascending: false })
            .limit(6)
        ]);

        setMovies(Array.isArray(trendingData) ? trendingData : []);
        setRecentReviews(reviewsData || []);
      } catch (err) {
        setError('Failed to load home feed');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 5rem 2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid #1f1f23',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          <Flame size={15} color="#ffffff" />
          <span>Trending</span>
        </div>

        <div onClick={() => setIsModalOpen(true)} style={{ position: 'relative', width: '220px', cursor: 'pointer' }}>
          <input
            type="text"
            readOnly
            placeholder="Search & Browse..."
            style={{
              width: '100%',
              padding: '7px 32px 7px 12px',
              background: '#0a0a0a',
              border: '1px solid var(--border-subtle, #27272a)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717a)' }} />
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted, #71717a)', marginTop: '4rem', fontSize: '0.9rem' }}>Loading films...</p>}
      {error && <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '4rem', fontSize: '0.9rem' }}>{error}</p>}
      {!loading && !error && movies.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted, #71717a)', marginTop: '4rem', fontSize: '0.9rem' }}>No matching films found.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '1.5rem' }}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      )}

      {/* Community Review Feed */}
      {!loading && recentReviews.length > 0 && (
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1f1f23' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <MessageSquareQuote size={16} color="#71717a" />
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #000000)', color: 'var(--text-pure, #ffffff)' }}>
      <Navbar onOpenAuth={handleOpenAuth} />
      <Routes>
        <Route path="/" element={<HomeFeed onSelectMovie={handleSelectMovie} />} />
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