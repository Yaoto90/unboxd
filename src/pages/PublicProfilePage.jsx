import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import StarRating from '../components/StarRating';
import { User, Bookmark, Star, ArrowLeft, Eye, Shield, Lock } from 'lucide-react';
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
          .select('id, username, avatar_url, role, bio, favorite_movies, is_private')
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

        // If the account is marked private, do not fetch their lists
        if (profileData.is_private) {
          setLoading(false);
          return;
        }

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
        <div className={styles.userProfileGroup}>
          <div className={styles.avatarWrap}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className={styles.avatarImg} />
            ) : (
              <User size={38} color="#a1a1aa" />
            )}
          </div>

          <div className={styles.userInfo}>
            <div className={styles.nameBadgeRow}>
              <h1 className={styles.username}>{profile.username}</h1>
              {profile.role === 'admin' && (
                <span className={styles.adminBadge}>
                  <Shield size={12} /> ADMIN
                </span>
              )}
              {profile.is_private && (
                <span className={styles.privateBadge}>
                  <Lock size={12} /> PRIVATE
                </span>
              )}
            </div>
          </div>
        </div>

        {!profile.is_private && (
          <div className={styles.statsRow}>
            <div className={styles.statBox}><span className={styles.statVal}>{watched.length}</span><p className={styles.statLabel}>Watched</p></div>
            <div className={styles.statBox}><span className={styles.statVal}>{watchlist.length}</span><p className={styles.statLabel}>Watchlist</p></div>
            <div className={styles.statBox}><span className={styles.statVal}>{reviews.length}</span><p className={styles.statLabel}>Reviews</p></div>
            <div className={styles.statBox}><span className={styles.statValHighlight}>{averageRating}</span><p className={styles.statLabel}>Avg Rating</p></div>
          </div>
        )}
      </div>

      {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

      {/* If the account is marked private, show the lock notice */}
      {profile.is_private ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '14px', margin: '2rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#141414', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid #282828' }}>
            <Lock size={20} color="#a3a3a3" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>This Account is Private</h2>
          <p style={{ color: '#737373', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
            {profile.username}&apos;s logs, reviews, and film activity are kept private.
          </p>
        </div>
      ) : (
        <>
          {Array.isArray(profile.favorite_movies) && profile.favorite_movies.length > 0 && (
            <div className={styles.favoritesSection}>
              <p className={styles.sectionHeaderSmall}>Favorite Films</p>
              <div className={styles.favoritesGrid}>
                {profile.favorite_movies.map((m) => (
                  <div key={m.tmdb_movie_id} onClick={() => onSelectMovie(m.tmdb_movie_id)} className={styles.favCard}>
                    <div className={styles.favPosterWrap}>
                      <img src={getImageUrl(m.poster_path, 'w342')} alt={m.title} className={styles.favPoster} />
                    </div>
                    <p className={styles.favTitle}>{m.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.tabsBar}>
            <button onClick={() => setActiveTab('watched')} className={`${styles.tabBtn} ${activeTab === 'watched' ? styles.tabBtnActive : ''}`}>
              <Eye size={17} /> Watched ({watched.length})
            </button>
            <button onClick={() => setActiveTab('watchlist')} className={`${styles.tabBtn} ${activeTab === 'watchlist' ? styles.tabBtnActive : ''}`}>
              <Bookmark size={17} /> Watchlist ({watchlist.length})
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}>
              <Star size={17} /> Reviews ({reviews.length})
            </button>
          </div>

          {activeTab === 'watched' && (
            <div className={styles.movieGrid}>
              {watched.map((item) => (
                <div key={item.id} onClick={() => onSelectMovie(item.tmdb_movie_id)} className={styles.card}>
                  <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} className={styles.cardPoster} />
                  <div className={styles.cardFooter}><span className={styles.cardTitle}>{item.movie_title}</span></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className={styles.movieGrid}>
              {watchlist.map((item) => (
                <div key={item.id} onClick={() => onSelectMovie(item.tmdb_movie_id)} className={styles.card}>
                  <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} className={styles.cardPoster} />
                  <div className={styles.cardFooter}><span className={styles.cardTitle}>{item.movie_title}</span></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className={styles.reviewsListGrid}>
              {sortedReviews.map((rev) => (
                <div key={rev.id} onClick={() => onSelectMovie(rev.tmdb_movie_id)} className={styles.reviewCard}>
                  <div className={styles.reviewPosterWrap}>
                    <img src={getImageUrl(rev.movie_poster_path, 'w185')} alt={rev.movie_title} className={styles.reviewPoster} />
                  </div>
                  <div className={styles.reviewBody}>
                    <div>
                      <h3 className={styles.reviewMovieTitle}>{rev.movie_title}</h3>
                      <StarRating rating={rev.rating || 0} interactive={false} size={14} />
                      <p className={styles.reviewText}>{rev.review_text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}