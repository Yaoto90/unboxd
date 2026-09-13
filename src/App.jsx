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
import SkeletonGrid from './components/SkeletonGrid';
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
import styles from './App.module.css';

function MovieCard({ movie, onSelect, isWatchlisted, onToggleWatchlist }) {
  if (!movie) return null;

  return (
    <div className={styles.card} onClick={() => onSelect(movie.id)}>
      <div className={styles.posterWrap}>
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title || 'Poster'}
          className={styles.poster}
        />

        {onToggleWatchlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie);
            }}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`${styles.watchlistBtn} ${isWatchlisted ? styles.watchlistBtnActive : ''}`}
          >
            <Bookmark size={14} fill={isWatchlisted ? '#000000' : 'none'} />
          </button>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{movie.title || 'Untitled'}</h3>

        <div className={styles.cardMeta}>
          <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
          <span className={styles.ratingBadge}>
            <Star size={13} fill="#ffffff" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

function HomeFeed({ onSelectMovie, onOpenAuth, onOpenSearch }) {
  const { user } = useAuth();
  const [activeFeed, setActiveFeed] = useState('trending');
  const [movies, setMovies] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          .eq('user_id', user.id)
          .or('type.eq.watchlist,type.is.null');

        if (data) {
          setWatchlistIds(new Set(data.map((item) => Number(item.tmdb_movie_id))));
        }
      } catch (err) {
        console.error('Failed to load watchlist:', err);
      }
    }
    loadWatchlist();
  }, [user]);

  useEffect(() => {
    async function loadCommunityReviews() {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('*, profiles(username, avatar_url), review_likes(user_id)')
          .order('created_at', { ascending: false })
          .limit(6);
        setRecentReviews(data || []);
      } catch (err) {
        console.error('Failed to load community reviews:', err);
      }
    }
    loadCommunityReviews();
  }, []);

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

  const handleToggleWatchlist = async (movie) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    const movieId = Number(movie.id);
    const isSaved = watchlistIds.has(movieId);

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
          .eq('tmdb_movie_id', movieId)
          .or('type.eq.watchlist,type.is.null');
      } else {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', movieId)
          .eq('type', 'watched');

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
    <div className={styles.homeContainer}>
      <div className={styles.filterBar}>
        <div className={styles.tabList}>
          {feedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFeed === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeed(tab.id)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              >
                <Icon size={13} color={isActive ? '#000000' : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* This search input stays for desktop, hidden on mobile */}
        <div onClick={onOpenSearch} className={styles.searchContainer}>
          <input
            type="text"
            readOnly
            placeholder="Search & Browse..."
            className={styles.searchInput}
          />
          <Search size={14} className={styles.searchIcon} />
        </div>
      </div>

      {loading && <SkeletonGrid count={18} minWidth="185px" />}
      
      {error && (
        <p className={`${styles.messageText} ${styles.errorText}`}>{error}</p>
      )}
      
      {!loading && !error && movies.length === 0 && (
        <p className={`${styles.messageText} ${styles.emptyText}`}>No matching films found.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div className={styles.movieGrid}>
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

      {!loading && recentReviews.length > 0 && (
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsHeader}>
            <MessageSquareQuote size={16} color="#737373" />
            <span className={styles.reviewsTitle}>
              Recent Community Reviews
            </span>
          </div>

          <div className={styles.reviewsGrid}>
            {recentReviews.slice(0, 6).map((rev) => (
              <ReviewCard
                key={rev.id}
                review={rev}
                onSelectMovie={onSelectMovie}
                showMoviePoster={true}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MainLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, initialMode: 'signin' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const selectedMovieId = searchParams.get('movie');

  const handleSelectMovie = (id, reviewId = null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('movie', id.toString());
      if (reviewId) {
        next.set('review', reviewId.toString());
      } else {
        next.delete('review');
      }
      return next;
    });
  };

  const handleCloseMovie = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('movie');
      next.delete('review');
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
    <div className={styles.appContainer}>
      <Navbar onOpenAuth={handleOpenAuth} onOpenSearch={() => setIsSearchOpen(true)} />
      <Routes>
        <Route path="/" element={<HomeFeed onSelectMovie={handleSelectMovie} onOpenAuth={handleOpenAuth} onOpenSearch={() => setIsSearchOpen(true)} />} />
        <Route path="/search" element={<SearchPage onSelectMovie={handleSelectMovie} />} />
        <Route path="/profile" element={<ProfilePage onSelectMovie={handleSelectMovie} />} />
        <Route path="/user/:username" element={<PublicProfilePage onSelectMovie={handleSelectMovie} />} />
      </Routes>
      
      <MovieDetailModal movieId={selectedMovieId} onClose={handleCloseMovie} />
      <SearchBrowseModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
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