import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import StarRating from '../components/StarRating';
import { User, Bookmark, Star, ArrowLeft, ArrowUpDown, Eye, Shield } from 'lucide-react';
import styles from './CSS/PublicProfilePage.module.css';

export default function PublicProfilePage({ onSelectMovie }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [activeTab, setActiveTab] = useState('watched');
  const [reviewSort, setReviewSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      setError('');
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role, bio, favorite_movies')
          .ilike('username', username)
          .maybeSingle();

        if (profileErr || !profileData) {
          setError('User not found');
          return;
        }

        if (user && profileData.id === user.id) {
          navigate('/profile', { replace: true });
          return;
        }

        setProfile(profileData);

        const [reviewsRes, listsRes] = await Promise.all([
          supabase.from('reviews').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false }),
          supabase.from('watchlists').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false })
        ]);

        const allLists = listsRes.data || [];
        const reviewsData = reviewsRes.data || [];

        const explicitWatched = allLists.filter((item) => item.type === 'watched');
        const watchedMovieIds = new Set(explicitWatched.map((item) => Number(item.tmdb_movie_id)));

        const implicitWatchedFromReviews = reviewsData
          .filter((rev) => !watchedMovieIds.has(Number(rev.tmdb_movie_id)))
          .map((rev) => ({
            id: `rev-${rev.id}`,
            tmdb_movie_id: rev.tmdb_movie_id,
            movie_title: rev.movie_title,
            movie_poster_path: rev.movie_poster_path,
            type: 'watched',
            created_at: rev.created_at
          }));

        const unifiedWatched = [...explicitWatched, ...implicitWatchedFromReviews];
        const allWatchedIds = new Set(unifiedWatched.map((item) => Number(item.tmdb_movie_id)));
        const cleanWatchlist = allLists.filter(
          (item) => (item.type === 'watchlist' || !item.type) && !allWatchedIds.has(Number(item.tmdb_movie_id))
        );

        setWatched(unifiedWatched);
        setWatchlist(cleanWatchlist);
        setReviews(reviewsData);
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [username, user, navigate]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    switch (reviewSort) {
      case 'oldest': return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'rating-high': return list.sort((a, b) => b.rating - a.rating);
      case 'rating-low': return list.sort((a, b) => a.rating - b.rating);
      case 'title': return list.sort((a, b) => (a.movie_title || '').localeCompare(b.movie_title || ''));
      case 'newest':
      default: return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviews, reviewSort]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : '-';

  if (loading) {
    return <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center', color: '#737373' }}>Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{error || 'User not found'}</p>
        <button onClick={() => navigate('/')} style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/')} className={styles.backBtn}>
        <ArrowLeft size={16} /> Back to films
      </button>

      <div className={styles.banner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className={styles.avatarWrap}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className={styles.avatarImg} />
            ) : (
              <User size={38} color="#a1a1aa" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className={styles.username}>{profile.username}</h1>
              {profile.role === 'admin' && (
                <span className={styles.adminBadge}>
                  <Shield size={12} /> ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}><span className={styles.statVal}>{watched.length}</span><p className={styles.statLabel}>Watched</p></div>
          <div className={styles.statBox}><span className={styles.statVal}>{watchlist.length}</span><p className={styles.statLabel}>Watchlist</p></div>
          <div className={styles.statBox}><span className={styles.statVal}>{reviews.length}</span><p className={styles.statLabel}>Reviews</p></div>
          <div className={styles.statBox}><span className={styles.statValHighlight}>{averageRating}</span><p className={styles.statLabel}>Avg Rating</p></div>
        </div>
      </div>

      {profile.bio && <p style={{ margin: '0 0 1.75rem 0', fontSize: '0.95rem', color: '#a3a3a3', lineHeight: 1.6, maxWidth: '640px' }}>{profile.bio}</p>}

      <div className={styles.tabsBar}>
        <button onClick={() => setActiveTab('watched')} className={`${styles.tabBtn} ${activeTab === 'watched' ? styles.tabBtnActive : ''}`}>
          <Eye size={18} /> Watched ({watched.length})
        </button>
        <button onClick={() => setActiveTab('watchlist')} className={`${styles.tabBtn} ${activeTab === 'watchlist' ? styles.tabBtnActive : ''}`}>
          <Bookmark size={18} /> Watchlist ({watchlist.length})
        </button>
        <button onClick={() => setActiveTab('reviews')} className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}>
          <Star size={18} /> Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'watched' && (
        <div className={styles.movieGrid}>
          {watched.map((item) => (
            <div key={item.id} onClick={() => onSelectMovie(item.tmdb_movie_id)} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #1e1e1e' }}>
              <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '0.85rem' }}><span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', display: 'block' }}>{item.movie_title}</span></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className={styles.movieGrid}>
          {watchlist.map((item) => (
            <div key={item.id} onClick={() => onSelectMovie(item.tmdb_movie_id)} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #1e1e1e' }}>
              <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '0.85rem' }}><span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', display: 'block' }}>{item.movie_title}</span></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {sortedReviews.map((rev) => (
            <div key={rev.id} onClick={() => onSelectMovie(rev.tmdb_movie_id)} style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem', display: 'flex', gap: '1.25rem', cursor: 'pointer' }}>
              <div style={{ width: '88px', flexShrink: 0, aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', background: '#121212', border: '1px solid #222222' }}>
                <img src={getImageUrl(rev.movie_poster_path, 'w185')} alt={rev.movie_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>{rev.movie_title}</h3>
                  <StarRating rating={rev.rating || 0} interactive={false} size={16} />
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: '#a3a3a3', lineHeight: '1.55' }}>{rev.review_text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}