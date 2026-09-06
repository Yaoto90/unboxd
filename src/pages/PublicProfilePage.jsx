import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getImageUrl } from '../services/tmdb';
import StarRating from '../components/StarRating';
import { User, Bookmark, Star } from 'lucide-react';

export default function PublicProfilePage({ onSelectMovie }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('watchlist');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch user by username
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', username)
          .single();

        if (profileErr || !profileData) {
          setError('User not found');
          return;
        }

        setProfile(profileData);

        // 2. Fetch user's reviews & watchlist in parallel
        const [reviewsRes, watchlistRes] = await Promise.all([
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

        setReviews(reviewsRes.data || []);
        setWatchlist(watchlistRes.data || []);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [username]);

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#71717a', marginTop: '4rem' }}>Loading profile...</p>;
  }

  if (error || !profile) {
    return <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '4rem' }}>{error || 'User not found'}</p>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#18181b',
          border: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <User size={28} color="#a1a1aa" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            {profile.username}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#71717a' }}>
            {watchlist.length} film{watchlist.length === 1 ? '' : 's'} in watchlist • {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #1f1f23', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: 'none',
            border: 'none',
            paddingBottom: '0.75rem',
            color: activeTab === 'watchlist' ? '#ffffff' : '#71717a',
            borderBottom: activeTab === 'watchlist' ? '2px solid #ffffff' : '2px solid transparent',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none',
            border: 'none',
            paddingBottom: '0.75rem',
            color: activeTab === 'reviews' ? '#ffffff' : '#71717a',
            borderBottom: activeTab === 'reviews' ? '2px solid #ffffff' : '2px solid transparent',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* Watchlist Tab View */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: '0.85rem' }}>No films in watchlist.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.25rem' }}>
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMovie(item.tmdb_movie_id)}
                  style={{ cursor: 'pointer', background: '#0a0a0a', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1f1f23' }}
                >
                  <img
                    src={getImageUrl(item.movie_poster_path)}
                    alt={item.movie_title}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.movie_title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab View */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: '0.85rem' }}>No reviews posted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => onSelectMovie(rev.tmdb_movie_id)}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1f1f23',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1.25rem',
                    cursor: 'pointer'
                  }}
                >
                  {rev.movie_poster_path && (
                    <img
                      src={getImageUrl(rev.movie_poster_path, 'w185')}
                      alt={rev.movie_title}
                      style={{ width: '54px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
                      {rev.movie_title}
                    </h3>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <StarRating rating={rev.rating || 0} interactive={false} size={12} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa', lineHeight: '1.5' }}>
                      {rev.review_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}