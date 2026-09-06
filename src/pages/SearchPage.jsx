import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMovies, discoverLetterboxd, getImageUrl } from '../services/tmdb';
import SearchBrowseModal from '../components/SearchBrowseModal';
import { Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function SearchPage({ onSelectMovie }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const type = searchParams.get('type') || 'popular';
  const value = searchParams.get('value') || 'all';
  const label = searchParams.get('label') || 'POPULAR / ALL TIME';
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 5rem 2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid #1f1f23',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {label}
          </span>
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
          marginTop: '3.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #1f1f23'
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#111111',
              border: '1px solid #1f1f23',
              color: page <= 1 ? '#3f3f46' : '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #71717a)' }}>
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
              border: '1px solid #1f1f23',
              color: page >= totalPages ? '#3f3f46' : '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <SearchBrowseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}