import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies, discoverLetterboxd, getImageUrl } from '../services/tmdb';
import SearchBrowseModal from '../components/SearchBrowseModal';
import SkeletonGrid from '../components/SkeletonGrid';
import { Star, ChevronLeft, ChevronRight, SlidersHorizontal, Film } from 'lucide-react';
import styles from './CSS/SearchPage.module.css';

function MovieCard({ movie, onSelect }) {
  if (!movie) return null;

  return (
    <div onClick={() => onSelect(movie.id)} className={styles.card}>
      <div className={styles.cardPosterWrap}>
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title || 'Poster'}
          className={styles.cardPoster}
        />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{movie.title || 'Untitled'}</h3>

        <div className={styles.cardMeta}>
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

  const type = searchParams.get('type') || 'popular';
  const value = searchParams.get('value') || 'all';
  const label = searchParams.get('label') || 'FILMS';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const decade = searchParams.get('decade') || '';
  const year = searchParams.get('year') || '';
  const popular = searchParams.get('popular') || '';
  const rating = searchParams.get('rating') || '';
  const genres = searchParams.get('genres') || '';

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
        } else if (type === 'filter') {
          data = await discoverLetterboxd({
            decade,
            year,
            popularTime: popular,
            ratingOrder: rating,
            genreId: genres,
            page
          });
        } else if (type === 'popular') {
          data = await discoverLetterboxd({ popularTime: value, page });
        } else if (type === 'rating') {
          data = await discoverLetterboxd({ ratingOrder: value, page });
        } else if (type === 'decade') {
          data = await discoverLetterboxd({ decade: value, page });
        } else if (type === 'year') {
          data = await discoverLetterboxd({ primaryReleaseYear: value, page });
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
  }, [type, value, decade, year, popular, rating, genres, page]);

  const setPage = (newPage) => {
    searchParams.set('page', String(newPage));
    setSearchParams(searchParams);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <Film size={18} color="#ffffff" />
          <h1 className={styles.pageTitle}>{label}</h1>
        </div>

        <button onClick={() => setIsModalOpen(true)} className={styles.filterTriggerBtn}>
          <SlidersHorizontal size={14} /> Filter & Search
        </button>
      </div>

      {loading && <SkeletonGrid count={30} minWidth="185px" />}
      {error && <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '5rem', fontSize: '1rem' }}>{error}</p>}
      {!loading && !error && movies.length === 0 && (
        <p style={{ textAlign: 'center', color: '#737373', marginTop: '5rem', fontSize: '1rem' }}>No matching films found.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div className={styles.movieGrid}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
          ))}
        </div>
      )}

      {!loading && movies.length > 0 && totalPages > 1 && (
        <div className={styles.paginationRow}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={`${styles.pageBtn} ${page <= 1 ? styles.pageBtnDisabled : styles.pageBtnEnabled}`}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: '#8a8a8a' }}>
            Page <strong style={{ color: '#ffffff' }}>{page}</strong> of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className={`${styles.pageBtn} ${page >= totalPages ? styles.pageBtnDisabled : styles.pageBtnEnabled}`}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <SearchBrowseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}