import { useEffect, useState, useMemo, useRef } from 'react';
import { getCompanyDetails, getCompanyMovies, getImageUrl } from '../services/tmdb';
import { X, Star, MapPin, Globe, Building2, ChevronDown } from 'lucide-react';
import SkeletonGrid from './SkeletonGrid';
import styles from './CSS/CompanyDetailModal.module.css';

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

function CompanyMovieCard({ film, onSelect }) {
  if (!film) return null;

  return (
    <div
      onClick={() => onSelect(film.id)}
      style={{
        backgroundColor: '#0a0a0a',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid #1e1e1e',
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#383838';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.65)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#1e1e1e';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: '#121212' }}>
        <img
          src={getImageUrl(film.poster_path)}
          alt={film.title || 'Poster'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div style={{ padding: '0.75rem 0.85rem' }}>
        <h3
          style={{
            fontSize: '0.9rem',
            margin: '0 0 0.35rem 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#e5e5e5',
            fontWeight: 500
          }}
        >
          {film.title || 'Untitled'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#737373' }}>
          <span>{film.release_date ? film.release_date.split('-')[0] : 'N/A'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontWeight: 600 }}>
            <Star size={13} fill="#ffffff" />
            {film.vote_average ? film.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailModal({ companyId, onClose, onSelectMovie }) {
  const [company, setCompany] = useState(null);
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [eraFilter, setEraFilter] = useState({ type: 'all', value: 'all', label: 'All Years' });
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [hoveredDecade, setHoveredDecade] = useState(null);
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const yearRef = useRef(null);
  const genreRef = useRef(null);
  const sortRef = useRef(null);

  // Background scroll lock logic
  useEffect(() => {
    if (companyId) {
      const currentCount = parseInt(document.body.dataset.modalLockCount || '0', 10);
      document.body.dataset.modalLockCount = currentCount + 1;
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (companyId) {
        const currentCount = parseInt(document.body.dataset.modalLockCount || '0', 10);
        const nextCount = Math.max(0, currentCount - 1);
        document.body.dataset.modalLockCount = nextCount;
        if (nextCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [companyId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearMenuOpen(false);
        setHoveredDecade(null);
      }
      if (genreRef.current && !genreRef.current.contains(e.target)) setIsGenreMenuOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    let isMounted = true;
    async function loadCompanyData() {
      setLoading(true);
      setError(null);
      try {
        const [compData, filmsData] = await Promise.all([
          getCompanyDetails(companyId),
          getCompanyMovies(companyId)
        ]);
        if (isMounted) {
          setCompany(compData);
          setFilms(filmsData);
        }
      } catch (err) {
        console.error('Failed to load company data:', err);
        if (isMounted) setError(err.message || 'Failed to load studio details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCompanyData();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const decadeGroups = useMemo(() => {
    const map = new Map();
    films.forEach((film) => {
      if (film.release_date) {
        const yr = parseInt(film.release_date.split('-')[0], 10);
        if (!isNaN(yr)) {
          const dec = Math.floor(yr / 10) * 10;
          if (!map.has(dec)) map.set(dec, new Set());
          map.get(dec).add(yr);
        }
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([decade, yearSet]) => ({
        decade,
        years: Array.from(yearSet).sort((a, b) => b - a)
      }));
  }, [films]);

  const availableGenres = useMemo(() => {
    const genreIds = new Set();
    films.forEach((film) => {
      if (Array.isArray(film.genre_ids)) {
        film.genre_ids.forEach((gid) => genreIds.add(gid));
      }
    });
    return Array.from(genreIds)
      .filter((gid) => GENRE_MAP[gid])
      .map((gid) => ({ id: gid, name: GENRE_MAP[gid] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [films]);

  const filteredFilms = useMemo(() => {
    let result = [...films];

    if (eraFilter.type === 'decade') {
      const dec = parseInt(eraFilter.value, 10);
      result = result.filter((film) => {
        if (!film.release_date) return false;
        const yr = parseInt(film.release_date.split('-')[0], 10);
        return Math.floor(yr / 10) * 10 === dec;
      });
    } else if (eraFilter.type === 'year') {
      const yr = parseInt(eraFilter.value, 10);
      result = result.filter((film) => {
        if (!film.release_date) return false;
        return parseInt(film.release_date.split('-')[0], 10) === yr;
      });
    }

    if (selectedGenre !== 'all') {
      const targetGenreId = parseInt(selectedGenre, 10);
      result = result.filter((film) => Array.isArray(film.genre_ids) && film.genre_ids.includes(targetGenreId));
    }

    result.sort((a, b) => {
      if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === 'votes') return (b.vote_count || 0) - (a.vote_count || 0);
      if (sortBy === 'release-new') {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'release-old') {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    return result;
  }, [films, eraFilter, selectedGenre, sortBy]);

  const sortLabels = {
    popularity: 'Popularity',
    rating: 'Rating',
    votes: 'Total Votes',
    'release-new': 'Release (Newest)',
    'release-old': 'Release (Oldest)',
    title: 'Film Title (A–Z)'
  };

  const isSortActive = sortBy !== 'popularity';

  if (!companyId) return null;

  return (
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modal}>
        <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
          <X size={16} />
        </button>

        {loading ? (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: '150px', height: '150px', borderRadius: '12px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ width: '45%', height: '40px', borderRadius: '8px', marginBottom: '1rem' }} />
                <div className="skeleton-box" style={{ width: '60%', height: '20px', borderRadius: '6px' }} />
              </div>
            </div>
            <SkeletonGrid count={12} minWidth="170px" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', color: '#ef4444', fontSize: '1.15rem' }}>
            {error}
          </div>
        ) : company ? (
          <div>
            <div className={styles.heroRow}>
              <div className={styles.logoWrap}>
                {company.logo_path ? (
                  <img src={getImageUrl(company.logo_path, 'w300')} alt={company.name} className={styles.logo} />
                ) : (
                  <Building2 size={56} color="#000000" />
                )}
              </div>

              <div className={styles.infoCol}>
                <h2 className={styles.companyName}>{company.name}</h2>

                <div className={styles.metaRow}>
                  <span className={styles.metaBadge}>
                    <Building2 size={16} /> Production Studio
                  </span>
                  {company.origin_country && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} /> {company.origin_country}
                    </span>
                  )}
                  {company.homepage && (
                    <a href={company.homepage} target="_blank" rel="noreferrer" className={styles.metaLink}>
                      <Globe size={16} /> Website
                    </a>
                  )}
                </div>

                {company.description && (
                  <p className={styles.description}>{company.description}</p>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  PRODUCTIONS
                </span>
                <span style={{ fontSize: '0.82rem', color: '#737373', fontWeight: 600 }}>
                  ({filteredFilms.length})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                {/* 1. YEAR / DECADE CASCADE FILTER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', position: 'relative' }} ref={yearRef}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#737373', letterSpacing: '0.05em' }}>
                    YEAR
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: eraFilter.type !== 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${eraFilter.type !== 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}`,
                      color: eraFilter.type !== 'all' ? '#000000' : '#d4d4d4',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{eraFilter.label}</span>
                    <ChevronDown size={13} style={{ transform: isYearMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {isYearMenuOpen && (
                    <div className={styles.dropdownMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setEraFilter({ type: 'all', value: 'all', label: 'All Years' });
                          setIsYearMenuOpen(false);
                          setHoveredDecade(null);
                        }}
                        className={styles.dropdownItem}
                        style={{
                          background: eraFilter.type === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                        }}
                      >
                        All Years
                      </button>

                      <div style={{ height: '1px', background: '#222222', margin: '3px 0' }} />

                      {decadeGroups.map((group) => {
                        const isDecadeActive = eraFilter.type === 'decade' && Number(eraFilter.value) === group.decade;
                        const isYearActiveInDec = eraFilter.type === 'year' && group.years.includes(Number(eraFilter.value));
                        const isHovered = hoveredDecade === group.decade;

                        return (
                          <div
                            key={group.decade}
                            style={{ position: 'relative' }}
                            onMouseEnter={() => setHoveredDecade(group.decade)}
                            onMouseLeave={() => setHoveredDecade(null)}
                          >
                            <button
                              type="button"
                              onClick={() => setHoveredDecade(hoveredDecade === group.decade ? null : group.decade)}
                              className={styles.dropdownItem}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: (isDecadeActive || isYearActiveInDec) ? 'rgba(255, 255, 255, 0.15)' : isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                              }}
                            >
                              <span>{group.decade}s</span>
                              <ChevronDown size={11} style={{ transform: 'rotate(-90deg)', opacity: 0.7 }} />
                            </button>

                            {/* Flyout Submenu */}
                            {isHovered && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-15px',
                                  left: '100%',
                                  padding: '15px 0 15px 6px',
                                  zIndex: 140
                                }}
                              >
                                <div
                                  style={{
                                    background: '#0d0d0d',
                                    border: '1px solid rgba(255, 255, 255, 0.16)',
                                    borderRadius: '9px',
                                    padding: '6px',
                                    minWidth: '135px',
                                    maxHeight: '230px',
                                    overflowY: 'auto',
                                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.96)'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEraFilter({ type: 'decade', value: String(group.decade), label: `All ${group.decade}s` });
                                      setIsYearMenuOpen(false);
                                      setHoveredDecade(null);
                                    }}
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      background: isDecadeActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                      border: 'none',
                                      color: '#ffffff',
                                      padding: '5px 8px',
                                      borderRadius: '5px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = isDecadeActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent')}
                                  >
                                    All {group.decade}s
                                  </button>

                                  <div style={{ height: '1px', background: '#222222', margin: '4px 0' }} />

                                  {group.years.map((yr) => {
                                    const isThisYear = eraFilter.type === 'year' && Number(eraFilter.value) === yr;
                                    return (
                                      <button
                                        key={yr}
                                        type="button"
                                        onClick={() => {
                                          setEraFilter({ type: 'year', value: String(yr), label: String(yr) });
                                          setIsYearMenuOpen(false);
                                          setHoveredDecade(null);
                                        }}
                                        style={{
                                          width: '100%',
                                          textAlign: 'left',
                                          background: isThisYear ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                          border: 'none',
                                          color: isThisYear ? '#ffffff' : '#d4d4d4',
                                          padding: '5px 8px',
                                          borderRadius: '5px',
                                          fontSize: '0.78rem',
                                          fontWeight: 500,
                                          cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = isThisYear ? 'rgba(255, 255, 255, 0.15)' : 'transparent')}
                                      >
                                        {yr}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. GENRE FILTER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', position: 'relative' }} ref={genreRef}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#737373', letterSpacing: '0.05em' }}>GENRE</span>
                  <button
                    type="button"
                    onClick={() => setIsGenreMenuOpen(!isGenreMenuOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: selectedGenre !== 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${selectedGenre !== 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}`,
                      color: selectedGenre !== 'all' ? '#000000' : '#d4d4d4',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{selectedGenre === 'all' ? 'All Genres' : availableGenres.find((g) => String(g.id) === selectedGenre)?.name || 'Genre'}</span>
                    <ChevronDown size={13} style={{ transform: isGenreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {isGenreMenuOpen && (
                    <div className={styles.dropdownMenu} style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGenre('all');
                          setIsGenreMenuOpen(false);
                        }}
                        className={styles.dropdownItem}
                        style={{
                          background: selectedGenre === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                        }}
                      >
                        All Genres
                      </button>
                      <div style={{ height: '1px', background: '#222222', margin: '3px 0' }} />
                      {availableGenres.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedGenre(String(g.id));
                            setIsGenreMenuOpen(false);
                          }}
                          className={styles.dropdownItem}
                          style={{
                            background: String(g.id) === selectedGenre ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                          }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. SORT BY */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', position: 'relative' }} ref={sortRef}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#737373', letterSpacing: '0.05em' }}>SORT BY</span>
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSortActive ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isSortActive ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}`,
                      color: isSortActive ? '#000000' : '#d4d4d4',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{sortLabels[sortBy] || 'Sort'}</span>
                    <ChevronDown size={13} style={{ transform: isSortMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {isSortMenuOpen && (
                    <div className={styles.dropdownMenu} style={{ right: 0, left: 'auto', minWidth: '160px' }}>
                      {Object.entries(sortLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSortBy(key);
                            setIsSortMenuOpen(false);
                          }}
                          className={styles.dropdownItem}
                          style={{
                            background: sortBy === key ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {filteredFilms.map((film) => (
                <CompanyMovieCard key={film.id} film={film} onSelect={onSelectMovie} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}