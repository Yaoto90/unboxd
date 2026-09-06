import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search } from 'lucide-react';

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
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest', label: 'Lowest Rated' }
];

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
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
    navigateToSearch('search', q, `SEARCH / "${q}"`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          overflowY: 'auto',
          backgroundColor: '#0a0a0a',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.5rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: '#71717a' }}>
            FIND & BROWSE
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#18181b',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 38px 9px 12px',
                background: '#111111',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Search size={15} />
            </button>
          </div>
        </form>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={sectionHeaderStyle}>YEAR</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
            {DECADES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => navigateToSearch('decade', d.id, `FILMS OF THE ${d.label}`)}
                style={itemButtonStyle}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={sectionHeaderStyle}>POPULAR</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
            {POPULAR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => navigateToSearch('popular', opt.id, `POPULAR / ${opt.label.toUpperCase()}`)}
                style={itemButtonStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={sectionHeaderStyle}>RATING</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => navigateToSearch('rating', opt.id, `${opt.label.toUpperCase()}`)}
                style={itemButtonStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={sectionHeaderStyle}>GENRE</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
            {GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => navigateToSearch('genre', g.id, `${g.name.toUpperCase()} FILMS`)}
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
  display: 'block',
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '1px',
  color: '#52525b',
  marginBottom: '0.5rem'
};

const itemButtonStyle = {
  background: '#111111',
  border: '1px solid #1f1f23',
  color: '#e4e4e7',
  padding: '7px 8px',
  borderRadius: '5px',
  fontSize: '0.75rem',
  fontWeight: 500,
  textAlign: 'center',
  cursor: 'pointer'
};