import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies, discoverLetterboxd, getImageUrl } from '../services/tmdb';
import SearchBrowseModal from '../components/SearchBrowseModal';
import { Star, Search, ChevronLeft, ChevronRight, SlidersHorizontal, Film } from 'lucide-react';

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
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${isHovered ? '#3b82f6' : '#1e1e1e'}`,
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.7)' : 'none'
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
      </div>

      <div style={{ padding: '0.75rem 0.85rem' }}>
        <h3 style={{
          fontSize: '0.88rem',
          margin: '0 0 0.35rem 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isHovered ? '#ffffff' : '#e5e5e5',
          fontWeight: 600,
          transition: 'color 0.15s ease'
        }}>
          {movie.title || 'Untitled'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#737373' }}>
          <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 700 }}>
            <Star size={12} fill="#22c55e" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage({ onSelectMovie }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = searchParams.get('type') || 'popular';
  const value = searchParams.get('value') || 'all';
  const label = searchParams.get('label') || 'POPULAR FILMS';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        let data;
        if (type === 'search') {
          data = await searchMovies(value, page);
        } else if (type === 'popular') {
          data = await discoverLetterboxd({ popularTime: value, page });
        } else if (type === 'rating') {
          data = await discoverLetterboxd({ ratingOrder: value, page });
        } else if (type === 'decade') {
          data = await discoverLetterboxd({ decade: value, page });
        } else if (type === 'genre') {
          data = await discoverLetterboxd({ genreId: value, page });
        }

        setMovies(Array.isArray(data?.results) ? data.results : []);
        setTotalPages(Math.min(data?.totalPages || 1, 250));
      } catch (err) {
        setError(err.message || 'Failed to fetch movies');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [type, value, page]);

  const setPage = (newPage) => {
    searchParams.set('page', String(newPage));
    setSearchParams(searchParams);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem 6rem 1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #1f1f23',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Film size={18} color="#22c55e" />
          <h1 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            {label}
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#111111',
            border: '1px solid #282828',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal size={14} /> Filter & Search
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#737373', marginTop: '5rem', fontSize: '1rem' }}>Querying TMDB archives...</p>}
      {error && <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '5rem', fontSize: '1rem' }}>{error}</p>}
      {!loading && !error && movies.length === 0 && (
        <p style={{ textAlign: 'center', color: '#737373', marginTop: '5rem', fontSize: '1rem' }}>No matching films found.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
          ))}
        </div>
      )}

      {!loading && movies.length > 0 && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.25rem',
          marginTop: '4rem',
          paddingTop: '2rem',
          borderTop: '1px solid #1a1a1a'
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#111111',
              border: '1px solid #262626',
              color: page <= 1 ? '#404040' : '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: '#8a8a8a' }}>
            Page <strong style={{ color: '#ffffff' }}>{page}</strong> of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#111111',
              border: '1px solid #262626',
              color: page >= totalPages ? '#404040' : '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <SearchBrowseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}