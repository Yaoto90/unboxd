import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Sparkles, Flame, Calendar, Film, Star, ChevronDown, Check, RotateCcw } from 'lucide-react';
import styles from './CSS/SearchBrowseModal.module.css';

const DECADES = [
  { id: '2020', label: '2020s', years: [2026, 2025, 2024, 2023, 2022, 2021, 2020] },
  { id: '2010', label: '2010s', years: [2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010] },
  { id: '2000', label: '2000s', years: [2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000] },
  { id: '1990', label: '1990s', years: [1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990] },
  { id: '1980', label: '1980s', years: [1989, 1988, 1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980] },
  { id: '1970', label: '1970s', years: [1979, 1978, 1977, 1976, 1975, 1974, 1973, 1972, 1971, 1970] }
];

const POPULAR_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'year', label: 'This Year' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' }
];

const RATING_OPTIONS = [
  { id: 'highest', label: 'Top Rated' },
  { id: 'lowest', label: 'Lowest Rated' }
];

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' },
  { id: '14', name: 'Fantasy' },
  { id: '27', name: 'Horror' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi' },
  { id: '53', name: 'Thriller' }
];

function GlassButton({ children, onClick, active, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.glassBtn} ${active ? styles.glassBtnActive : ''}`}
      style={style}
    >
      {children}
    </button>
  );
}

export default function SearchBrowseModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState({ type: null, value: null, label: null });
  const [selectedPopular, setSelectedPopular] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [openDecadeId, setOpenDecadeId] = useState(null);
  const decadeContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (decadeContainerRef.current && !decadeContainerRef.current.contains(e.target)) {
        setOpenDecadeId(null);
      }
    };
    if (openDecadeId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDecadeId]);

  if (!isOpen) return null;

  const handleClearFilters = () => {
    setSelectedEra({ type: null, value: null, label: null });
    setSelectedPopular(null);
    setSelectedRating(null);
    setSelectedGenres([]);
  };

  const handleToggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    const labelParts = [];

    if (selectedEra.type && selectedEra.value) {
      params.set(selectedEra.type, selectedEra.value);
      labelParts.push(selectedEra.label);
    }

    if (selectedPopular) {
      params.set('popular', selectedPopular);
      const opt = POPULAR_OPTIONS.find((o) => o.id === selectedPopular);
      if (opt) labelParts.push(`Popular (${opt.label})`);
    }

    if (selectedRating) {
      params.set('rating', selectedRating);
      const opt = RATING_OPTIONS.find((o) => o.id === selectedRating);
      if (opt) labelParts.push(opt.label);
    }

    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.join(','));
      const names = selectedGenres.map((gid) => GENRES.find((g) => g.id === gid)?.name).filter(Boolean);
      labelParts.push(names.join(' & '));
    }

    params.set('type', 'filter');
    params.set('page', '1');
    params.set('label', labelParts.length > 0 ? labelParts.join(' • ') : 'FILMS');

    onClose();
    navigate(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setQuery('');
    onClose();
    navigate(`/search?type=search&value=${encodeURIComponent(q)}&label=${encodeURIComponent(`Search: "${q}"`)}&page=1`);
  };

  const hasSelectedFilters = Boolean(
    selectedEra.value || selectedPopular || selectedRating || selectedGenres.length > 0
  );

  return (
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#ffffff" />
            <span className={styles.headerTitle}>Discover Films</span>
          </div>

          <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={15} />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search by title, director, keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" aria-label="Execute search" className={styles.searchIconBtn}>
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* RELEASE ERA */}
        <div style={{ marginBottom: '1.4rem' }} ref={decadeContainerRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} color="#ffffff" />
              <span className={styles.sectionHeader}>RELEASE ERA</span>
            </div>
            {selectedEra.value && (
              <span style={{ fontSize: '0.74rem', color: '#a3a3a3', fontWeight: 600 }}>
                Selected: <strong style={{ color: '#ffffff' }}>{selectedEra.label}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem', position: 'relative' }}>
            {DECADES.map((d) => {
              const isOpenMenu = openDecadeId === d.id;
              const isDecadeSelected = selectedEra.type === 'decade' && selectedEra.value === d.id;
              const isYearSelectedInDecade = selectedEra.type === 'year' && d.years.includes(Number(selectedEra.value));
              const isActive = isDecadeSelected || isYearSelectedInDecade;

              return (
                <div key={d.id} style={{ position: 'relative' }}>
                  <GlassButton
                    active={isActive || isOpenMenu}
                    onClick={() => setOpenDecadeId(isOpenMenu ? null : d.id)}
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <span>{isYearSelectedInDecade ? selectedEra.value : d.label}</span>
                    <ChevronDown
                      size={12}
                      style={{
                        transform: isOpenMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  </GlassButton>

                  {isOpenMenu && (
                    <div className={styles.dropdownMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEra(
                            isDecadeSelected
                              ? { type: null, value: null, label: null }
                              : { type: 'decade', value: d.id, label: `${d.label} Cinema` }
                          );
                          setOpenDecadeId(null);
                        }}
                        className={`${styles.dropdownItem} ${isDecadeSelected ? styles.dropdownItemActive : ''}`}
                      >
                        All {d.label}
                      </button>
                      <div style={{ height: '1px', background: '#222222', margin: '4px 0' }} />
                      {d.years.map((yr) => {
                        const isYrActive = selectedEra.type === 'year' && Number(selectedEra.value) === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setSelectedEra(
                                isYrActive
                                  ? { type: null, value: null, label: null }
                                  : { type: 'year', value: String(yr), label: `${yr} Cinema` }
                              );
                              setOpenDecadeId(null);
                            }}
                            className={`${styles.dropdownItem} ${isYrActive ? styles.dropdownItemActive : ''}`}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* POPULARITY */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Flame size={13} color="#ffffff" />
            <span className={styles.sectionHeader}>POPULARITY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
            {POPULAR_OPTIONS.map((opt) => (
              <GlassButton
                key={opt.id}
                active={selectedPopular === opt.id}
                onClick={() => setSelectedPopular(selectedPopular === opt.id ? null : opt.id)}
              >
                {opt.label}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* CRITICAL ACCLAIM */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Star size={13} color="#ffffff" />
            <span className={styles.sectionHeader}>CRITICAL ACCLAIM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {RATING_OPTIONS.map((opt) => (
              <GlassButton
                key={opt.id}
                active={selectedRating === opt.id}
                onClick={() => setSelectedRating(selectedRating === opt.id ? null : opt.id)}
              >
                {opt.label}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* GENRES */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Film size={13} color="#ffffff" />
              <span className={styles.sectionHeader}>GENRE (MULTI-SELECT)</span>
            </div>
            {selectedGenres.length > 0 && (
              <span style={{ fontSize: '0.74rem', color: '#a3a3a3', fontWeight: 600 }}>
                {selectedGenres.length} selected
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.5rem' }}>
            {GENRES.map((g) => (
              <GlassButton
                key={g.id}
                active={selectedGenres.includes(g.id)}
                onClick={() => handleToggleGenre(g.id)}
              >
                {g.name}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasSelectedFilters}
            className={`${styles.clearBtn} ${hasSelectedFilters ? styles.clearBtnActive : styles.clearBtnDisabled}`}
          >
            <RotateCcw size={14} /> Clear All
          </button>

          <button
            type="button"
            onClick={handleApply}
            className={styles.applyBtn}
          >
            <Check size={16} /> Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}