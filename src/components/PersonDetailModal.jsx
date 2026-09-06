import { useEffect, useState, useMemo } from 'react';
import { getPersonDetails, getPersonMovieCredits, getImageUrl } from '../services/tmdb';
import { X, Star, Calendar, MapPin, Clapperboard, Loader2 } from 'lucide-react';

export default function PersonDetailModal({ personId, onClose, onSelectMovie }) {
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!personId) return;

    let isMounted = true;
    async function loadPersonData() {
      setLoading(true);
      setError(null);
      try {
        const [detailsData, creditsData] = await Promise.all([
          getPersonDetails(personId),
          getPersonMovieCredits(personId)
        ]);
        if (isMounted) {
          setPerson(detailsData);
          setCredits(creditsData);
        }
      } catch (err) {
        console.error('Failed to load person data:', err);
        if (isMounted) setError(err.message || 'Failed to load details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPersonData();

    return () => {
      isMounted = false;
    };
  }, [personId]);

  const topFilms = useMemo(() => {
    if (!credits) return [];
    const all = [
      ...(credits.cast || []),
      ...(credits.crew?.filter((c) => c.job === 'Director') || [])
    ];

    const uniqueMap = new Map();
    all.forEach((item) => {
      if (!uniqueMap.has(item.id) && item.poster_path) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 18);
  }, [credits]);

  if (!personId) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 4000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          width: '100%',
          maxWidth: '1240px',
          minHeight: '460px',
          maxHeight: '90vh',
          borderRadius: '16px',
          overflowY: 'auto',
          border: '1px solid #242424',
          color: '#ffffff',
          position: 'relative',
          padding: '3rem 3.5rem',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.98)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.75rem',
            right: '1.75rem',
            background: 'rgba(24, 24, 24, 0.9)',
            border: '1px solid #333333',
            color: '#ffffff',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#333333')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(24, 24, 24, 0.9)')}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', gap: '1rem', color: '#888888' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '1.15rem' }}>Loading filmography...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', color: '#ef4444', fontSize: '1.15rem' }}>
            {error}
          </div>
        ) : person ? (
          <div>
            {/* Person Profile Header */}
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
              <div
                style={{
                  width: '190px',
                  height: '260px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#161616',
                  border: '1px solid #282828',
                  flexShrink: 0
                }}
              >
                {person.profile_path ? (
                  <img
                    src={getImageUrl(person.profile_path, 'w342')}
                    alt={person.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555555' }}>
                    No Photo
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: '0 0 0.6rem 0', fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {person.name}
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', color: '#a3a3a3', fontSize: '0.98rem', marginBottom: '1.5rem' }}>
                  {person.known_for_department && (
  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700 }}>
    <Clapperboard size={16} />{' '}
    {
      {
        Acting: 'Actor',
        Directing: 'Director',
        Writing: 'Writer',
        Production: 'Producer',
        Camera: 'Cinematographer',
        Sound: 'Composer / Sound',
        Editing: 'Editor'
      }[person.known_for_department] || person.known_for_department
    }
  </span>
)}
                  {person.birthday && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} /> Born {person.birthday}
                    </span>
                  )}
                  {person.place_of_birth && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} /> {person.place_of_birth}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    color: '#d4d4d4',
                    lineHeight: '1.7',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {person.biography || 'No biography available for this person.'}
                </p>
              </div>
            </div>

            {/* Known For Grid */}
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
                Known For ({topFilms.length})
              </h3>

              {topFilms.length === 0 ? (
                <p style={{ color: '#737373', fontSize: '1.1rem' }}>No known film credits found.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '1.5rem'
                  }}
                >
                  {topFilms.map((film) => (
                    <div
                      key={film.id}
                      onClick={() => onSelectMovie(film.id)}
                      style={{
                        background: '#121212',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #222222',
                        transition: 'transform 0.15s ease, border-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#404040';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#222222';
                      }}
                    >
                      <img
                        src={getImageUrl(film.poster_path, 'w342')}
                        alt={film.title}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '0.85rem' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {film.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e', fontSize: '0.85rem', fontWeight: 700 }}>
                          <Star size={13} fill="#22c55e" />
                          <span>{film.vote_average ? film.vote_average.toFixed(1) : '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}