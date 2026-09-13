import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, searchMovies } from '../services/tmdb';
import StarRating from '../components/StarRating';
import { 
  User, Bookmark, Star, Trash2, Shield, ArrowLeft, Lock, KeyRound, 
  Eye, Camera, Loader2, X, Check, ZoomIn, ZoomOut, Edit3, Globe, 
  Plus, AlertTriangle, LogOut, Search
} from 'lucide-react';
import styles from './CSS/ProfilePage.module.css';

function ProfileRecordsSkeleton() {
  return (
    <div className={styles.movieGrid}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className="skeleton-box" style={{ width: '100%', aspectRatio: '2/3' }} />
          <div className={styles.cardFooter}>
            <div className="skeleton-box" style={{ height: '14px', width: '78%', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AvatarCropModal({ imageSrc, onCropComplete, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const boxSize = 240;

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    };
  }, [imageSrc]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const getRenderDimensions = (currentZoom) => {
    if (!imgElement) return { width: boxSize, height: boxSize };
    const aspect = imgElement.width / imgElement.height;
    let baseW, baseH;
    if (aspect >= 1) {
      baseH = boxSize;
      baseW = boxSize * aspect;
    } else {
      baseW = boxSize;
      baseH = boxSize / aspect;
    }
    return { width: baseW * currentZoom, height: baseH * currentZoom };
  };

  const clampOffset = (x, y, currentZoom) => {
    const { width, height } = getRenderDimensions(currentZoom);
    const maxOffsetX = Math.max(0, (width - boxSize) / 2);
    const maxOffsetY = Math.max(0, (height - boxSize) / 2);

    return {
      x: Math.min(Math.max(x, -maxOffsetX), maxOffsetX),
      y: Math.min(Math.max(y, -maxOffsetY), maxOffsetY)
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    };

    const handlePointerMove = (moveEvent) => {
      if (!draggingRef.current) return;
      const rawX = moveEvent.clientX - dragStartRef.current.x;
      const rawY = moveEvent.clientY - dragStartRef.current.y;
      setOffset(clampOffset(rawX, rawY, zoom));
    };

    const handlePointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
  };

  const handleSave = () => {
    if (!imgElement) return;

    const canvas = document.createElement('canvas');
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const { width: renderW, height: renderH } = getRenderDimensions(zoom);
    const scaleFactor = outputSize / boxSize;

    const drawX = (boxSize / 2 - renderW / 2 + offset.x) * scaleFactor;
    const drawY = (boxSize / 2 - renderH / 2 + offset.y) * scaleFactor;
    const drawW = renderW * scaleFactor;
    const drawH = renderH * scaleFactor;

    ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
      },
      'image/webp',
      0.85
    );
  };

  const { width: currentW, height: currentH } = getRenderDimensions(zoom);

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.cropModalCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Reposition Picture</h3>
          <button onClick={onCancel} className={styles.iconBtn}>
            <X size={20} />
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onDragStart={(e) => e.preventDefault()}
          style={{ width: `${boxSize}px`, height: `${boxSize}px`, borderRadius: '50%', overflow: 'hidden', position: 'relative', background: '#121212', border: '2px solid rgba(255,255,255,0.4)', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
        >
          {imgElement && (
            <img
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{ position: 'absolute', width: `${currentW}px`, height: `${currentH}px`, maxWidth: 'none', maxHeight: 'none', transform: `translate(${offset.x}px, ${offset.y}px)`, pointerEvents: 'none', userSelect: 'none' }}
            />
          )}
        </div>

        <p style={{ fontSize: '0.8rem', color: '#888888', margin: '1rem 0 1.25rem 0' }}>
          Drag image to reposition • Slider to scale
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', width: '100%', marginBottom: '1.75rem', padding: '0 0.5rem' }}>
          <ZoomOut size={16} color="#737373" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#ffffff', cursor: 'pointer' }}
          />
          <ZoomIn size={16} color="#737373" />
        </div>

        <div style={{ display: 'flex', gap: '0.9rem', width: '100%' }}>
          <button onClick={onCancel} className={styles.secondaryGlassBtn}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.primaryActionBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={16} /> Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditReviewModal({ review, onClose, onUpdated }) {
  const [rating, setRating] = useState(review.rating || 4.0);
  const [text, setText] = useState(review.review_text || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ rating: parseFloat(rating), review_text: text.trim() })
        .eq('id', review.id);

      if (error) throw error;
      onUpdated({ ...review, rating: parseFloat(rating), review_text: text.trim() });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className={styles.modalBackdrop}>
      <div onClick={(e) => e.stopPropagation()} className={styles.editReviewModalCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Edit Review: {review.movie_title}</h3>
          <button onClick={onClose} className={styles.iconBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <StarRating rating={rating} onChange={(val) => setRating(val)} size={24} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{rating.toFixed(1)}</span>
          </div>

          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={styles.formInput}
            style={{ resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
            <button type="button" onClick={onClose} className={styles.secondaryGlassBtn}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={styles.primaryActionBtn}>
              {saving ? 'Saving...' : 'Update Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage({ onSelectMovie }) {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading, signOut } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('watched');
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const [editingReview, setEditingReview] = useState(null);

  // Settings form states
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ type: '', msg: '' });

  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState({ type: '', msg: '' });

  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioStatus, setBioStatus] = useState({ type: '', msg: '' });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', msg: '' });

  // Favorite films management
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [favSearchQuery, setFavSearchQuery] = useState('');
  const [favSearchResults, setFavSearchResults] = useState([]);
  const [favSearching, setFavSearching] = useState(false);
  
  // Fav Films Modal state
  const [editingFavIndex, setEditingFavIndex] = useState(null);

  // Account deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Background scroll lock for any open modal within ProfilePage
  const isAnyModalOpen = Boolean(
    cropImageSrc || editingReview || showDeleteModal || editingFavIndex !== null
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const currentCount = parseInt(document.body.dataset.modalLockCount || '0', 10);
      document.body.dataset.modalLockCount = currentCount + 1;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (isAnyModalOpen) {
        const currentCount = parseInt(document.body.dataset.modalLockCount || '0', 10);
        const nextCount = Math.max(0, currentCount - 1);
        document.body.dataset.modalLockCount = nextCount;
        if (nextCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    setUsernameInput(profile?.username || user.email?.split('@')[0] || '');
    setBioInput(profile?.bio || '');
    setIsPrivate(Boolean(profile?.is_private));
    setFavoriteMovies(Array.isArray(profile?.favorite_movies) ? profile.favorite_movies : []);

    async function fetchUserData() {
      setLoading(true);
      try {
        const [listsRes, revRes] = await Promise.all([
          supabase.from('watchlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        const allLists = listsRes.data || [];
        const reviewsData = revRes.data || [];

        const explicitWatched = allLists.filter((item) => item.type === 'watched');
        const explicitWatchedIds = new Set(explicitWatched.map((item) => Number(item.tmdb_movie_id)));

        const implicitWatched = reviewsData
          .filter((rev) => !explicitWatchedIds.has(Number(rev.tmdb_movie_id)))
          .map((rev) => ({
            id: `rev-${rev.id}`,
            tmdb_movie_id: Number(rev.tmdb_movie_id),
            movie_title: rev.movie_title,
            movie_poster_path: rev.movie_poster_path,
            type: 'watched',
            created_at: rev.created_at
          }));

        const watchedMap = new Map();
        [...explicitWatched, ...implicitWatched].forEach((item) => {
          if (item.tmdb_movie_id && !watchedMap.has(Number(item.tmdb_movie_id))) {
            watchedMap.set(Number(item.tmdb_movie_id), item);
          }
        });
        const finalWatchedList = Array.from(watchedMap.values());

        const allWatchedIds = new Set(finalWatchedList.map((item) => Number(item.tmdb_movie_id)));
        const cleanWatchlist = allLists.filter(
          (item) => (item.type === 'watchlist' || !item.type) && !allWatchedIds.has(Number(item.tmdb_movie_id))
        );

        setWatched(finalWatchedList);
        setWatchlist(cleanWatchlist);
        setReviews(reviewsData);

        const missingFromDb = reviewsData.filter((rev) => !explicitWatchedIds.has(Number(rev.tmdb_movie_id)));
        if (missingFromDb.length > 0) {
          const toInsert = missingFromDb.map((rev) => ({
            user_id: user.id,
            tmdb_movie_id: Number(rev.tmdb_movie_id),
            movie_title: rev.movie_title,
            movie_poster_path: rev.movie_poster_path,
            type: 'watched'
          }));
          supabase.from('watchlists').insert(toInsert).then(() => {});
        }
      } catch (err) {
        console.error('Failed to load user records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, authLoading, profile, navigate]);

  useEffect(() => {
    if (!user) return;

    const handleStatusChange = async (e) => {
      const { movieId, isWatched, reviewDeleted, reviewId: deletedReviewId } = e.detail || {};
      const numericId = Number(movieId);

      if (typeof isWatched === 'boolean') {
        if (isWatched) {
          const { data: movieData } = await supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', user.id)
            .eq('tmdb_movie_id', numericId)
            .eq('type', 'watched')
            .maybeSingle();

          if (movieData) {
            setWatched((prev) => {
              if (prev.some((w) => Number(w.tmdb_movie_id) === numericId)) return prev;
              return [movieData, ...prev];
            });
          }
        } else {
          setWatched((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== numericId));
        }
      }

      if (reviewDeleted) {
        if (deletedReviewId) {
          setReviews((prev) => prev.filter((r) => String(r.id) !== String(deletedReviewId)));
        } else if (numericId) {
          setReviews((prev) => prev.filter((r) => Number(r.tmdb_movie_id) !== numericId));
        }
      } else if (numericId) {
        const { data: latestReviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (latestReviews) setReviews(latestReviews);
      }
    };

    window.addEventListener('unboxd:movie-status-changed', handleStatusChange);
    return () => window.removeEventListener('unboxd:movie-status-changed', handleStatusChange);
  }, [user]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropSave = async (blob) => {
    setCropImageSrc(null);
    setUploadingAvatar(true);

    try {
      const filePath = `${user.id}/avatar_${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      if (profileError) throw profileError;

      await refreshProfile();
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();
    if (!cleanUsername || cleanUsername.length < 3) return;

    setSavingUsername(true);
    setUsernameStatus({ type: '', msg: '' });

    try {
      const { data: existing } = await supabase.from('profiles').select('id').ilike('username', cleanUsername).neq('id', user.id).maybeSingle();
      if (existing) {
        setUsernameStatus({ type: 'error', msg: 'This username is taken.' });
        setSavingUsername(false);
        return;
      }

      await supabase.from('profiles').update({ username: cleanUsername }).eq('id', user.id);
      await refreshProfile();
      setUsernameStatus({ type: 'success', msg: 'Username updated!' });
    } catch (err) {
      setUsernameStatus({ type: 'error', msg: err.message });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const nextState = !isPrivate;
    setIsPrivate(nextState);
    setSavingPrivacy(true);
    setPrivacyStatus({ type: '', msg: '' });

    try {
      await supabase.from('profiles').update({ is_private: nextState }).eq('id', user.id);
      await refreshProfile();
      setPrivacyStatus({ type: 'success', msg: nextState ? 'Account is now Private.' : 'Account is now Public.' });
    } catch (err) {
      setIsPrivate(!nextState);
      setPrivacyStatus({ type: 'error', msg: err.message || 'Failed to update privacy.' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    setBioStatus({ type: '', msg: '' });

    try {
      await supabase.from('profiles').update({ bio: bioInput.trim() }).eq('id', user.id);
      await refreshProfile();
      setBioStatus({ type: 'success', msg: 'Bio updated!' });
    } catch (err) {
      setBioStatus({ type: 'error', msg: err.message });
    } finally {
      setSavingBio(false);
    }
  };

  const handleFavSearch = async (e) => {
    const q = e.target.value;
    setFavSearchQuery(q);
    if (!q.trim()) {
      setFavSearchResults([]);
      return;
    }
    setFavSearching(true);
    try {
      const data = await searchMovies(q.trim(), 1);
      setFavSearchResults(Array.isArray(data?.results) ? data.results.slice(0, 5) : []);
    } finally {
      setFavSearching(false);
    }
  };

  const handleSelectFavFromMenu = async (movie) => {
    const newFav = { 
      tmdb_movie_id: movie.id, 
      title: movie.title, 
      poster_path: movie.poster_path,
      release_date: movie.release_date || ''
    };
    let updated = [...favoriteMovies];

    if (editingFavIndex !== null && editingFavIndex < updated.length) {
      updated[editingFavIndex] = newFav;
    } else {
      if (!updated.some((m) => m.tmdb_movie_id === newFav.tmdb_movie_id) && updated.length < 4) {
        updated.push(newFav);
      }
    }
    
    setFavoriteMovies(updated);
    setEditingFavIndex(null);
    setFavSearchQuery('');
    setFavSearchResults([]);

    try {
      await supabase.from('profiles').update({ favorite_movies: updated }).eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to auto-save favorite films:', err);
    }
  };

  const handleRemoveFromMenu = async () => {
    let updated = [...favoriteMovies];
    
    if (editingFavIndex !== null) {
      const target = favoriteMovies[editingFavIndex];
      if (target) {
        updated = updated.filter((m) => m.tmdb_movie_id !== target.tmdb_movie_id);
      }
    }
    
    setFavoriteMovies(updated);
    setEditingFavIndex(null);

    try {
      await supabase.from('profiles').update({ favorite_movies: updated }).eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to auto-save favorite films:', err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword || newPassword.length < 6) return;
    setSavingPassword(true);
    setPasswordStatus({ type: '', msg: '' });

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setPasswordStatus({ type: 'success', msg: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({ type: 'error', msg: error.message });
    }
    setSavingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;
    setDeletingAccount(true);

    try {
      await supabase.from('reviews').delete().eq('user_id', user.id);
      await supabase.from('watchlists').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      await signOut();
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveItem = async (e, item, type) => {
    e.stopPropagation();
    const movieId = Number(item.tmdb_movie_id);
    await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', movieId).eq('type', type);

    if (type === 'watched') {
      await supabase.from('reviews').delete().eq('user_id', user.id).eq('tmdb_movie_id', movieId);
      setWatched((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== movieId));
      setReviews((prev) => prev.filter((r) => Number(r.tmdb_movie_id) !== movieId));
      window.dispatchEvent(new CustomEvent('unboxd:movie-status-changed', { detail: { movieId, isWatched: false, reviewDeleted: true } }));
    } else {
      setWatchlist((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== movieId));
    }
  };

  const handleDeleteReview = async (e, id) => {
    e.stopPropagation();
    if (!id) return;
    const target = reviews.find((r) => r.id === id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((item) => String(item.id) !== String(id)));
      if (target) {
        window.dispatchEvent(new CustomEvent('unboxd:movie-status-changed', { detail: { movieId: Number(target.tmdb_movie_id), reviewDeleted: true, reviewId: id } }));
      }
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : '-';

  if (authLoading || (!user && loading)) {
    return <div style={{ textAlign: 'center', color: '#737373', padding: '6rem 2rem' }}>Loading session...</div>;
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />

      {cropImageSrc && <AvatarCropModal imageSrc={cropImageSrc} onCropComplete={handleCropSave} onCancel={() => setCropImageSrc(null)} />}
      {editingReview && <EditReviewModal review={editingReview} onClose={() => setEditingReview(null)} onUpdated={(up) => setReviews((prev) => prev.map((r) => (r.id === up.id ? up : r)))} />}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.deleteModalCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Delete Account</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#a3a3a3', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>
              This action is <strong style={{ color: '#ffffff' }}>permanent and irreversible</strong>. All your logged films, reviews, ratings, and profile settings will be permanently removed.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#737373', margin: '0 0 0.5rem 0' }}>
              Type <strong style={{ color: '#ffffff' }}>DELETE</strong> below to confirm:
            </p>
            <input 
              type="text" 
              value={deleteConfirmText} 
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className={styles.formInput}
              style={{ marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className={styles.secondaryGlassBtn}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={deleteConfirmText.trim() !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
                className={styles.dangerActionBtn}
              >
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Favorite Films Menu Modal */}
      {editingFavIndex !== null && (
        <div className={styles.modalBackdrop} onClick={() => setEditingFavIndex(null)}>
          <div className={styles.editReviewModalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {favoriteMovies[editingFavIndex] ? 'Edit Favorite Film' : 'Choose Favorite Film'}
              </h3>
              <button onClick={() => setEditingFavIndex(null)} className={styles.iconBtn}>
                <X size={20} />
              </button>
            </div>

            {favoriteMovies[editingFavIndex] && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span className={styles.microHeader}>Currently Pinned</span>
                <div className={styles.favModalCurrent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={getImageUrl(favoriteMovies[editingFavIndex].poster_path, 'w92')} 
                      alt="poster" 
                      style={{ width: '44px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                        {favoriteMovies[editingFavIndex].title}
                      </span>
                      {favoriteMovies[editingFavIndex].release_date && (
                        <span style={{ fontSize: '0.8rem', color: '#8a8a8a' }}>
                          {favoriteMovies[editingFavIndex].release_date.split('-')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={handleRemoveFromMenu} className={styles.favModalRemoveBtn}>
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div>
              <span className={styles.microHeader}>
                {favoriteMovies[editingFavIndex] ? 'Replace With' : 'Search to Pin'}
              </span>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search a movie title..."
                  value={favSearchQuery}
                  onChange={handleFavSearch}
                  className={`${styles.formInput} ${styles.searchInputWithIcon}`}
                  autoFocus
                />
              </div>
              {favSearching && <p style={{ color: '#737373', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>Searching...</p>}
              
              {favSearchResults.length > 0 && (
                <div className={styles.favModalResults}>
                  {favSearchResults.map((film) => (
                    <div key={film.id} onClick={() => handleSelectFavFromMenu(film)} className={styles.favDropdownItem}>
                      <img src={getImageUrl(film.poster_path, 'w92')} alt={film.title} style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>{film.title}</p>
                        <span style={{ fontSize: '0.8rem', color: '#8a8a8a' }}>{film.release_date?.split('-')[0] || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/')} className={styles.backBtn}>
        <ArrowLeft size={16} /> Back to films
      </button>

      {/* Profile Top Banner */}
      <div className={styles.banner}>
        <div className={styles.userProfileGroup}>
          <div
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            className={styles.avatarWrapper}
            style={{ cursor: uploadingAvatar ? 'wait' : 'pointer' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile Avatar" className={styles.avatarImg} />
            ) : (
              <User size={42} color="#737373" />
            )}
            <div className={styles.avatarOverlay} style={{ opacity: avatarHover || uploadingAvatar ? 1 : 0 }}>
              {uploadingAvatar ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={24} color="#ffffff" />}
            </div>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.nameBadgeRow}>
              <h1 className={styles.userName}>{profile?.username || user.email?.split('@')[0]}</h1>
              {profile?.role === 'admin' && (
                <span className={styles.adminBadge}>
                  <Shield size={12} /> ADMIN
                </span>
              )}
              {profile?.is_private && (
                <span className={styles.privateBadge}>
                  <Lock size={12} /> PRIVATE
                </span>
              )}
            </div>
            <p className={styles.email}>{user.email}</p>
            {profile?.bio && <p className={styles.bioInline}>{profile.bio}</p>}
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}><span className={styles.statVal}>{watched.length}</span><p className={styles.statLabel}>Watched</p></div>
          <div className={styles.statBox}><span className={styles.statVal}>{watchlist.length}</span><p className={styles.statLabel}>Watchlist</p></div>
          <div className={styles.statBox}><span className={styles.statVal}>{reviews.length}</span><p className={styles.statLabel}>Reviews</p></div>
          <div className={styles.statBox}><span className={styles.statVal}>{averageRating}</span><p className={styles.statLabel}>Avg Rating</p></div>
        </div>
      </div>

      {/* Favorite Films Showcase (Hidden in settings tab) */}
      {Array.isArray(profile?.favorite_movies) && profile.favorite_movies.length > 0 && activeTab !== 'profile' && (
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

      {/* Tabs Bar with Frosted Monochrome Indicator */}
      <div className={styles.tabsBar}>
        <button onClick={() => setActiveTab('watched')} className={`${styles.tabBtn} ${activeTab === 'watched' ? styles.tabBtnActive : ''}`}>
          <Eye size={17} /> Watched ({watched.length})
        </button>
        <button onClick={() => setActiveTab('watchlist')} className={`${styles.tabBtn} ${activeTab === 'watchlist' ? styles.tabBtnActive : ''}`}>
          <Bookmark size={17} /> Watchlist ({watchlist.length})
        </button>
        <button onClick={() => setActiveTab('reviewed')} className={`${styles.tabBtn} ${activeTab === 'reviewed' ? styles.tabBtnActive : ''}`}>
          <Star size={17} /> Reviews ({reviews.length})
        </button>
        <button onClick={() => setActiveTab('profile')} className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}>
          <User size={17} /> Settings
        </button>
      </div>

      {loading ? (
        <ProfileRecordsSkeleton />
      ) : activeTab === 'watched' ? (
        <div className={styles.movieGrid}>
          {watched.map((item) => (
            <div key={item.id || item.tmdb_movie_id} onClick={() => onSelectMovie(item.tmdb_movie_id)} className={styles.card}>
              <div className={styles.posterWrap}>
                <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} className={styles.cardPoster} />
                <button onClick={(e) => handleRemoveItem(e, item, 'watched')} className={styles.removeBtn} title="Remove">
                  <Trash2 size={14} color="#ffffff" />
                </button>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardTitle}>{item.movie_title}</span>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'watchlist' ? (
        <div className={styles.movieGrid}>
          {watchlist.map((item) => (
            <div key={item.id || item.tmdb_movie_id} onClick={() => onSelectMovie(item.tmdb_movie_id)} className={styles.card}>
              <div className={styles.posterWrap}>
                <img src={getImageUrl(item.movie_poster_path, 'w500')} alt={item.movie_title} className={styles.cardPoster} />
                <button onClick={(e) => handleRemoveItem(e, item, 'watchlist')} className={styles.removeBtn} title="Remove">
                  <Trash2 size={14} color="#ffffff" />
                </button>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardTitle}>{item.movie_title}</span>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'reviewed' ? (
        <div className={styles.reviewsListGrid}>
          {sortedReviews.map((rev) => (
            <div key={rev.id} onClick={() => onSelectMovie(rev.tmdb_movie_id)} className={styles.reviewCard}>
              <div className={styles.reviewPosterWrap}>
                <img src={getImageUrl(rev.movie_poster_path, 'w185')} alt={rev.movie_title} className={styles.reviewPoster} />
              </div>
              <div className={styles.reviewBody}>
                <div>
                  <div className={styles.reviewHeader}>
                    <h3 className={styles.reviewMovieTitle}>{rev.movie_title}</h3>
                    <div className={styles.reviewActions}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingReview(rev); }} className={styles.cardActionBtn} title="Edit"><Edit3 size={14} /></button>
                      <button onClick={(e) => handleDeleteReview(e, rev.id)} className={styles.cardActionBtn} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <StarRating rating={rev.rating || 0} interactive={false} size={14} />
                  <p className={styles.reviewText}>{rev.review_text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Settings Section - Redesigned Layout */
        <div className={styles.settingsLayout}>
          <div className={styles.settingsColumns}>
            
            {/* Left Column: Profile Elements (Favorites, Name, Bio) */}
            <div className={styles.columnStack}>
              
              {/* Favorite 4 Films Selection */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <Star size={18} color="#ffffff" />
                  <h3 className={styles.settingsSectionTitle}>Favorite Films</h3>
                </div>
                <p className={styles.settingDesc}>These 4 films are featured at the top of your profile showcase.</p>

                <div className={styles.favSlotsRow}>
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const fav = favoriteMovies[slotIdx];
                    return (
                      <div 
                        key={slotIdx} 
                        className={styles.favSlot}
                        onClick={() => {
                          setEditingFavIndex(slotIdx);
                          setFavSearchQuery('');
                          setFavSearchResults([]);
                        }}
                        style={{ cursor: 'pointer' }}
                        title={fav ? 'Edit favorite' : 'Add favorite'}
                      >
                        {fav ? (
                          <div className={styles.favSlotFilled}>
                            <img src={getImageUrl(fav.poster_path, 'w342')} alt={fav.title} className={styles.favSlotImg} />
                            <span className={styles.favSlotLabel}>{fav.title}</span>
                          </div>
                        ) : (
                          <div className={styles.favSlotEmpty}>
                            <Plus size={18} color="#525252" />
                            <span style={{ fontSize: '0.75rem', color: '#737373' }}>Empty</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Username */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <User size={18} color="#ffffff" />
                  <h3 className={styles.settingsSectionTitle}>Display Name</h3>
                </div>
                <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className={styles.formLabel}>Username</label>
                    <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className={styles.formInput} />
                  </div>
                  {usernameStatus.msg && <p style={{ margin: 0, fontSize: '0.82rem', color: usernameStatus.type === 'success' ? '#ffffff' : '#ef4444' }}>{usernameStatus.msg}</p>}
                  <button type="submit" disabled={savingUsername} className={styles.primaryActionBtn}>{savingUsername ? 'Saving...' : 'Update Name'}</button>
                </form>
              </div>

              {/* Bio */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <Edit3 size={18} color="#ffffff" />
                  <h3 className={styles.settingsSectionTitle}>Bio</h3>
                </div>
                <form onSubmit={handleUpdateBio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className={styles.formLabel}>About You</label>
                    <textarea rows={3} value={bioInput} onChange={(e) => setBioInput(e.target.value)} maxLength={280} className={styles.formInput} style={{ resize: 'vertical' }} />
                  </div>
                  {bioStatus.msg && <p style={{ margin: 0, fontSize: '0.82rem', color: bioStatus.type === 'success' ? '#ffffff' : '#ef4444' }}>{bioStatus.msg}</p>}
                  <button type="submit" disabled={savingBio} className={styles.primaryActionBtn}>{savingBio ? 'Saving...' : 'Update Bio'}</button>
                </form>
              </div>
            </div>

            {/* Right Column: Settings & Security (Privacy, Password, Session, Danger) */}
            <div className={styles.columnStack}>
              
              {/* Account Privacy */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  {isPrivate ? <Lock size={18} color="#ffffff" /> : <Globe size={18} color="#ffffff" />}
                  <h3 className={styles.settingsSectionTitle}>Account Privacy</h3>
                </div>
                <p className={styles.settingDesc}>
                  {isPrivate 
                    ? 'Your profile is Private. Visitors cannot see your logged films or reviews.' 
                    : 'Your profile is Public. Anyone can view your watched films and ratings.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>Private Mode</span>
                  <button 
                    type="button" 
                    onClick={handleTogglePrivacy} 
                    disabled={savingPrivacy}
                    className={`${styles.toggleSwitch} ${isPrivate ? styles.toggleSwitchActive : ''}`}
                    aria-label="Toggle profile privacy"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
                {privacyStatus.msg && (
                  <p style={{ margin: '0.85rem 0 0 0', fontSize: '0.82rem', color: privacyStatus.type === 'success' ? '#ffffff' : '#ef4444' }}>
                    {privacyStatus.msg}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <Lock size={18} color="#ffffff" />
                  <h3 className={styles.settingsSectionTitle}>Change Password</h3>
                </div>
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className={styles.formLabel}>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.formInput} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.formInput} />
                  </div>
                  {passwordStatus.msg && <p style={{ margin: 0, fontSize: '0.82rem', color: passwordStatus.type === 'success' ? '#ffffff' : '#ef4444' }}>{passwordStatus.msg}</p>}
                  <button type="submit" disabled={savingPassword} className={styles.primaryActionBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={15} /> {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Session Management */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <LogOut size={18} color="#ffffff" />
                  <h3 className={styles.settingsSectionTitle}>Session</h3>
                </div>
                <p className={styles.settingDesc}>Safely log out of your current session on this device.</p>
                <button 
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }} 
                  className={styles.secondaryGlassBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className={`${styles.settingsBox} ${styles.dangerBox}`}>
                <div className={styles.settingsHeader}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <h3 className={styles.settingsSectionTitle} style={{ color: '#ef4444' }}>Danger Zone</h3>
                </div>
                <p className={styles.settingDesc}>Permanently delete your account, ratings, reviews, and logs.</p>
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className={styles.dangerActionBtn}
                >
                  Delete Account...
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}