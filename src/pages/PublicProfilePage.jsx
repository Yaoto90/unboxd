import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import { User, Bookmark, Star, ArrowLeft, ArrowUpDown, Eye, Shield } from 'lucide-react';

export default function PublicProfilePage({ onSelectMovie }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [activeTab, setActiveTab] = useState('watched');
  const [reviewSort, setReviewSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to personal profile dashboard if user navigates to their own public URL
  useEffect(() => {
    if (
      username &&
      authProfile?.username &&
      authProfile.username.toLowerCase() === username.toLowerCase()
    ) {
      navigate('/profile', { replace: true });
    }
  }, [username, authProfile, navigate]);

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      setError('');
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role')
          .ilike('username', username)
          .maybeSingle();

        if (profileErr || !profileData) {
          setError('User not found');
          return;
        }

        setProfile(profileData);

        const [reviewsRes, listsRes] = await Promise.all([
          supabase
            .from('reviews')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false })
        ]);

        const allLists = listsRes.data || [];
        setWatchlist(allLists.filter((item) => item.type === 'watchlist' || !item.type));
        setWatched(allLists.filter((item) => item.type === 'watched'));
        setReviews(reviewsRes.data || []);
      } catch (err) {
        console.error('Failed to load user profile data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [username]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    switch (reviewSort) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'rating-high':
        return list.sort((a, b) => b.rating - a.rating);
      case 'rating-low':
        return list.sort((a, b) => a.rating - b.rating);
      case 'title':
        return list.sort((a, b) => (a.movie_title || '').localeCompare(b.movie_title || ''));
      case 'newest':
      default:
        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviews, reviewSort]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : '-';

  if (loading) {
    return (
      <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center', color: '#737373', fontSize: '1.05rem' }}>
        Loading member profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{error || 'User not found'}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#141414',
            border: '1px solid #2a2a2a',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '3rem 2rem 6rem 2rem' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2.5rem',
          background: 'none',
          border: 'none',
          color: '#8a8a8a',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: 500,
          transition: 'color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8a')}
      >
        <ArrowLeft size={16} /> Back to films
      </button>

      {/* Profile Overview Card */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1e1e1e',
        borderRadius: '16px',
        padding: '2.5rem 3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div
            style={{
              width: '92px',
              height: '92px',
              borderRadius: '50%',
              background: '#121212',
              border: '2px solid #262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={38} color="#a1a1aa" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                {profile.username}
              </h1>
              {profile.role === 'admin' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  background: '#141414',
                  border: '1px solid #2a2a2a',
                  color: '#a3a3a3',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  <Shield size={12} /> ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div style={{ display: 'flex', gap: '2.5rem' }}>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {watched.length}
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#737373', fontWeight: 500 }}>
              Watched
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {watchlist.length}
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#737373', fontWeight: 500 }}>
              Watchlist
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {reviews.length}
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#737373', fontWeight: 500 }}>
              Reviews
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {averageRating}
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#737373', fontWeight: 500 }}>
              Avg Rating
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        borderBottom: '1px solid #1e1e1e',
        marginBottom: '2.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('watched')}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'watched' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'watched' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease'
          }}
        >
          <Eye size={18} /> Watched ({watched.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'watchlist' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'watchlist' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease'
          }}
        >
          <Bookmark size={18} /> Watchlist ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'reviews' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'reviews' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease'
          }}
        >
          <Star size={18} /> Reviews ({reviews.length})
        </button>
      </div>

      {/* Watched Tab */}
      {activeTab === 'watched' && (
        <div>
          {watched.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>No watched films logged yet.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1.5rem'
            }}>
              {watched.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMovie(item.tmdb_movie_id)}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid #1e1e1e',
                    position: 'relative',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <img
                    src={getImageUrl(item.movie_poster_path, 'w500')}
                    alt={item.movie_title}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '0.85rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {item.movie_title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>No films in watchlist.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1.5rem'
            }}>
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMovie(item.tmdb_movie_id)}
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid #1e1e1e',
                    position: 'relative',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <img
                    src={getImageUrl(item.movie_poster_path, 'w500')}
                    alt={item.movie_title}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '0.85rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {item.movie_title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>No reviews written yet.</p>
          ) : (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '1.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ArrowUpDown size={16} color="#737373" />
                  <span style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>Sort by:</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    style={{
                      background: '#111111',
                      border: '1px solid #222222',
                      color: '#ffffff',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rating-high">Highest Rating</option>
                    <option value="rating-low">Lowest Rating</option>
                    <option value="title">Title (A–Z)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
                {sortedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onSelectMovie(rev.tmdb_movie_id)}
                    style={{
                      background: '#0a0a0a',
                      border: '1px solid #1e1e1e',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1.25rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#383838')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
                  >
                    <div style={{ width: '88px', flexShrink: 0, aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', background: '#121212', border: '1px solid #222222' }}>
                      <img
                        src={getImageUrl(rev.movie_poster_path, 'w185')}
                        alt={rev.movie_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rev.movie_title}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? '#ffffff' : 'transparent'}
                              color={i < rev.rating ? '#ffffff' : '#333333'}
                            />
                          ))}
                          <span style={{ fontSize: '0.8rem', color: '#a3a3a3', marginLeft: '6px' }}>
                            {rev.rating}/5
                          </span>
                        </div>

                        <p style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          color: '#a3a3a3',
                          lineHeight: '1.55',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {rev.review_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}