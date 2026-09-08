import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Sparkles, Flame, Calendar, Film, Star } from 'lucide-react';

const DECADES = [
  { id: '2020', label: '2020s' },
  { id: '2010', label: '2010s' },
  { id: '2000', label: '2000s' },
  { id: '1990', label: '1990s' },
  { id: '1980', label: '1980s' },
  { id: '1970', label: '1970s' }
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

export default function SearchBrowseModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const navigateToSearch = (type, value, label) => {
    onClose();
    navigate(`/search?type=${encodeURIComponent(type)}&value=${encodeURIComponent(value)}&label=${encodeURIComponent(label)}&page=1`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setQuery('');
    navigateToSearch('search', q, `Search: "${q}"`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '88vh',
          overflowY: 'auto',
          backgroundColor: '#0a0a0a',
          border: '1px solid #222222',
          borderRadius: '16px',
          padding: '1.8rem',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.98)',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#22c55e" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', color: '#a3a3a3', textTransform: 'uppercase' }}>
              Discover Films
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#141414',
              border: '1px solid #262626',
              color: '#8a8a8a',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search by title, director, keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                background: '#121212',
                border: '1px solid #262626',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              aria-label="Execute search"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#737373',
                cursor: 'pointer'
              }}
            >
              <Search size={17} />
            </button>
          </div>
        </form>

        {/* DECADES */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Calendar size={13} color="#737373" />
            <span style={sectionHeaderStyle}>RELEASE ERA</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
            {DECADES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => navigateToSearch('decade', d.id, `${d.label} Cinema`)}
                style={itemButtonStyle}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* POPULAR TIME */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Flame size={13} color="#f97316" />
            <span style={sectionHeaderStyle}>POPULARITY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
            {POPULAR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => navigateToSearch('popular', opt.id, `Popular (${opt.label})`)}
                style={itemButtonStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* RATING */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Star size={13} color="#eab308" />
            <span style={sectionHeaderStyle}>CRITICAL ACCLAIM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => navigateToSearch('rating', opt.id, opt.label)}
                style={itemButtonStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* GENRES */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
            <Film size={13} color="#38bdf8" />
            <span style={sectionHeaderStyle}>GENRE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.5rem' }}>
            {GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => navigateToSearch('genre', g.id, `${g.name} Films`)}
                style={itemButtonStyle}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionHeaderStyle = {
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.08em',
  color: '#8a8a8a'
};

const itemButtonStyle = {
  background: '#111111',
  border: '1px solid #222222',
  color: '#d4d4d4',
  padding: '8px 10px',
  borderRadius: '7px',
  fontSize: '0.8rem',
  fontWeight: 600,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};