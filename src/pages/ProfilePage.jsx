import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import { User, Bookmark, Star, Trash2, Shield, ArrowLeft, Lock, KeyRound, ArrowUpDown } from 'lucide-react';

export default function ProfilePage({ onSelectMovie }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'watchlist' | 'reviewed'
  const [watchlist, setWatchlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest'); // 'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'title'
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    setUsernameInput(profile?.username || user.email?.split('@')[0] || '');

    async function fetchUserData() {
      setLoading(true);
      try {
        const [watchRes, revRes] = await Promise.all([
          supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        ]);

        setWatchlist(watchRes.data || []);
        setReviews(revRes.data || []);
      } catch (err) {
        console.error('Failed to load user records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, profile, navigate]);

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

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setSavingUsername(true);
    setUsernameStatus('');

    const { error } = await supabase
      .from('profiles')
      .update({ username: usernameInput.trim() })
      .eq('id', user.id);

    if (!error) {
      setUsernameStatus('Name updated successfully');
      setTimeout(() => setUsernameStatus(''), 3000);
    } else {
      setUsernameStatus(error.message);
    }
    setSavingUsername(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'Password must be at least 6 characters' });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus({ type: '', msg: '' });

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (!error) {
      setPasswordStatus({ type: 'success', msg: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus({ type: '', msg: '' }), 3000);
    } else {
      setPasswordStatus({ type: 'error', msg: error.message });
    }
    setSavingPassword(false);
  };

  const handleRemoveWatchlist = async (e, id) => {
    e.stopPropagation();
    const { error } = await supabase.from('watchlists').delete().eq('id', id);
    if (!error) {
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleDeleteReview = async (e, id) => {
    e.stopPropagation();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : '-';

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="btn-minimal-ghost"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem' }}
      >
        <ArrowLeft size={14} /> Back to films
      </button>

      {/* Profile Overview Header Card */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#18181b',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <User size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {profile?.username || user.email?.split('@')[0]}
              </h1>
              {profile?.role === 'admin' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  <Shield size={11} /> ADMIN
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {watchlist.length}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Watchlist
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {reviews.length}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Reviewed
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {averageRating}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Avg Rating
            </p>
          </div>
        </div>
      </div>

      {/* 3 Explicit Section Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'profile' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={15} /> Profile & Security
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'watchlist' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'watchlist' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Bookmark size={15} /> Watchlist ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('reviewed')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'reviewed' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'reviewed' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Star size={15} /> Reviewed ({reviews.length})
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>Loading records...</p>
      ) : activeTab === 'profile' ? (
        /* SECTION 1: PROFILE, CHANGE NAME & PASSWORD */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '850px' }}>
          
          {/* Change Display Name */}
          <div style={{ background: '#0a0a0a', border: '1px solid var(--border-subtle)', padding: '1.75rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <User size={18} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Change Display Name</h3>
            </div>
            
            <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter display name..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#111111',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {usernameStatus && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: usernameStatus.includes('successfully') ? '#22c55e' : '#ef4444' }}>
                  {usernameStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={savingUsername}
                className="btn-minimal-primary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {savingUsername ? 'Saving...' : 'Update Name'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div style={{ background: '#0a0a0a', border: '1px solid var(--border-subtle)', padding: '1.75rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Lock size={18} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Update Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#111111',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#111111',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {passwordStatus.msg && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: passwordStatus.type === 'success' ? '#22c55e' : '#ef4444' }}>
                  {passwordStatus.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="btn-minimal-primary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <KeyRound size={14} />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      ) : activeTab === 'watchlist' ? (
        /* SECTION 2: WATCHLIST */
        watchlist.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>Your watchlist is empty.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1.25rem'
          }}>
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectMovie(item.tmdb_movie_id)}
                style={{
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  position: 'relative'
                }}
              >
                <img
                  src={getImageUrl(item.movie_poster_path, 'w500')}
                  alt={item.movie_title}
                  style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.movie_title}
                  </span>
                  <button
                    onClick={(e) => handleRemoveWatchlist(e, item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* SECTION 3: REVIEWED (WITH SORT BAR) */
        <div>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>No reviews written yet.</p>
          ) : (
            <>
              {/* Sorting Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowUpDown size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sort by:</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    style={{
                      background: '#111111',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
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

              {/* Grid of Reviewed Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
                {sortedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onSelectMovie(rev.tmdb_movie_id)}
                    style={{
                      background: '#0a0a0a',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      gap: '1.25rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    {/* Movie Poster */}
                    <div style={{ width: '80px', flexShrink: 0, aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', background: '#18181b', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={getImageUrl(rev.movie_poster_path, 'w185')}
                        alt={rev.movie_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    {/* Review Body */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rev.movie_title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteReview(e, rev.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Rating Stars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '0.6rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            fill={i < rev.rating ? '#ffffff' : 'transparent'}
                            color={i < rev.rating ? '#ffffff' : '#3f3f46'}
                          />
                        ))}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                          {rev.rating}/5
                        </span>
                      </div>

                      {/* Review Text */}
                      <p style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {rev.review_text}
                      </p>
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