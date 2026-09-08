import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import StarRating from '../components/StarRating';
import { User, Bookmark, Star, Trash2, Shield, ArrowLeft, Lock, KeyRound, ArrowUpDown, Eye, Camera, Loader2, X, Check, ZoomIn, ZoomOut, Edit3 } from 'lucide-react';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          background: '#0d0d0d',
          border: '1px solid #242424',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.98)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Reposition Picture</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: `${boxSize}px`,
            height: `${boxSize}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            background: '#121212',
            border: '2px solid #22c55e',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none'
          }}
        >
          {imgElement && (
            <img
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                width: `${currentW}px`,
                height: `${currentH}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                pointerEvents: 'none',
                userSelect: 'none'
              }}
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
            style={{ flex: 1, accentColor: '#22c55e', cursor: 'pointer' }}
          />
          <ZoomIn size={16} color="#737373" />
        </div>

        <div style={{ display: 'flex', gap: '0.9rem', width: '100%' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              background: '#141414',
              border: '1px solid #262626',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              background: '#ffffff',
              border: 'none',
              color: '#000000',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
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
        .update({
          rating: parseFloat(rating),
          review_text: text.trim()
        })
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 4100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          border: '1px solid #282828',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.95)',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Edit Review: {review.movie_title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}>
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
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#121212',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#161616',
                border: '1px solid #262626',
                color: '#ffffff',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px',
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
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
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('watched');
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Avatar State
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  // Review Edit State
  const [editingReview, setEditingReview] = useState(null);

  // Profile Edit State
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ type: '', msg: '' });

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
        const [listsRes, revRes] = await Promise.all([
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

        const allLists = listsRes.data || [];
        const reviewsData = revRes.data || [];

        // 1. Explicit watched from watchlists table (works for watched without review)
        const explicitWatched = allLists.filter((item) => item.type === 'watched');
        const explicitWatchedIds = new Set(explicitWatched.map((item) => Number(item.tmdb_movie_id)));

        // 2. Implicit watched from reviews (ensures all reviewed movies also count as watched)
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

        // 3. Deduplicate Watched
        const watchedMap = new Map();
        [...explicitWatched, ...implicitWatched].forEach((item) => {
          if (item.tmdb_movie_id && !watchedMap.has(Number(item.tmdb_movie_id))) {
            watchedMap.set(Number(item.tmdb_movie_id), item);
          }
        });
        const finalWatchedList = Array.from(watchedMap.values());

        // 4. Watchlist (excludes items marked as watched or reviewed)
        const allWatchedIds = new Set(finalWatchedList.map((item) => Number(item.tmdb_movie_id)));
        const cleanWatchlist = allLists.filter(
          (item) => (item.type === 'watchlist' || !item.type) && !allWatchedIds.has(Number(item.tmdb_movie_id))
        );

        setWatched(finalWatchedList);
        setWatchlist(cleanWatchlist);
        setReviews(reviewsData);

        // 5. Background sync: write missing reviewed movies to watchlists table
        const missingFromDb = reviewsData.filter(
          (rev) => !explicitWatchedIds.has(Number(rev.tmdb_movie_id))
        );
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
  }, [user, profile, navigate]);

  // Sync listener to update counts and lists when toggled in MovieDetailModal
  useEffect(() => {
    const handleStatusChange = (e) => {
      const { movieId, isWatched, reviewDeleted } = e.detail || {};
      const numericId = Number(movieId);

      if (typeof isWatched === 'boolean') {
        if (!isWatched) {
          setWatched((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== numericId));
        }
      }

      if (reviewDeleted) {
        setReviews((prev) => prev.filter((r) => Number(r.tmdb_movie_id) !== numericId));
      }
    };

    window.addEventListener('unboxd:movie-status-changed', handleStatusChange);
    return () => window.removeEventListener('unboxd:movie-status-changed', handleStatusChange);
  }, []);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose a valid image file.');
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { contentType: 'image/webp', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
    } catch (err) {
      console.error('Failed to update avatar:', err);
      alert(err.message || 'Failed to update avatar image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();

    if (!cleanUsername) {
      setUsernameStatus({ type: 'error', msg: 'Username cannot be empty.' });
      return;
    }
    if (cleanUsername.length < 3) {
      setUsernameStatus({ type: 'error', msg: 'Username must be at least 3 characters.' });
      return;
    }
    if (cleanUsername.toLowerCase() === (profile?.username || '').toLowerCase()) {
      setUsernameStatus({ type: 'success', msg: 'Username is unchanged.' });
      setTimeout(() => setUsernameStatus({ type: '', msg: '' }), 3000);
      return;
    }

    setSavingUsername(true);
    setUsernameStatus({ type: '', msg: '' });

    try {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        setUsernameStatus({ type: 'error', msg: 'This username is taken.' });
        setSavingUsername(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setUsernameStatus({ type: 'success', msg: 'Username updated!' });
      setTimeout(() => setUsernameStatus({ type: '', msg: '' }), 3000);
    } catch (err) {
      setUsernameStatus({ type: 'error', msg: err.message || 'Failed to update username.' });
    } finally {
      setSavingUsername(false);
    }
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

    const { error } = await supabase.auth.updateUser({ password: newPassword });

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

  const handleRemoveItem = async (e, item, type) => {
    e.stopPropagation();
    const movieId = Number(item.tmdb_movie_id);

    try {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', movieId)
        .eq('type', type);

      if (type === 'watched') {
        // Remove associated review when removed from watched
        await supabase
          .from('reviews')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_movie_id', movieId);

        setWatched((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== movieId));
        setReviews((prev) => prev.filter((r) => Number(r.tmdb_movie_id) !== movieId));

        window.dispatchEvent(
          new CustomEvent('unboxd:movie-status-changed', {
            detail: { movieId, isWatched: false, reviewDeleted: true }
          })
        );
      } else {
        setWatchlist((prev) => prev.filter((w) => Number(w.tmdb_movie_id) !== movieId));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleDeleteReview = async (e, id) => {
    e.stopPropagation();
    const target = reviews.find((r) => r.id === id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((item) => item.id !== id));
      if (target) {
        window.dispatchEvent(
          new CustomEvent('unboxd:movie-status-changed', {
            detail: { movieId: Number(target.tmdb_movie_id), reviewDeleted: true }
          })
        );
      }
    }
  };

  const handleReviewUpdated = (updated) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : '-';

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem 1.5rem' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropSave}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onUpdated={handleReviewUpdated}
        />
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'none',
          border: 'none',
          color: '#8a8a8a',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
          transition: 'color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8a')}
      >
        <ArrowLeft size={16} /> Back to films
      </button>

      {/* Modern High-Impact Profile Banner */}
      <div style={{
        background: 'linear-gradient(180deg, #111111 0%, #080808 100%)',
        border: '1px solid #222222',
        borderRadius: '18px',
        padding: '2.5rem 2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
          {/* Avatar with Camera Overlay */}
          <div
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            title="Click to change and crop avatar"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#181818',
              border: '2px solid #333333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              position: 'relative',
              cursor: uploadingAvatar ? 'wait' : 'pointer',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={42} color="#737373" />
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: avatarHover || uploadingAvatar ? 1 : 0,
                transition: 'opacity 0.15s ease'
              }}
            >
              {uploadingAvatar ? (
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={24} color="#ffffff" />
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '2.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                {profile?.username || user.email?.split('@')[0]}
              </h1>
              {profile?.role === 'admin' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  background: '#1c1917',
                  border: '1px solid #44403c',
                  color: '#fbbf24',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  <Shield size={12} /> ADMIN
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#737373' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Aggregated Quick Metrics */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {watched.length}
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
              Watched
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {watchlist.length}
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
              Watchlist
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'block' }}>
              {reviews.length}
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
              Reviews
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', lineHeight: 1.1, display: 'block' }}>
              {averageRating}
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
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
            padding: '12px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'watched' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'watched' ? '2px solid #22c55e' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Eye size={17} /> Watched ({watched.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'watchlist' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'watchlist' ? '2px solid #22c55e' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Bookmark size={17} /> Watchlist ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('reviewed')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'reviewed' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'reviewed' ? '2px solid #22c55e' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Star size={17} /> Reviews ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'profile' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'profile' ? '2px solid #22c55e' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <User size={17} /> Settings
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1rem' }}>Loading records...</p>
      ) : activeTab === 'watched' ? (
        watched.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1rem' }}>No watched films recorded yet.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.5rem'
          }}>
            {watched.map((item) => (
              <div
                key={item.id || item.tmdb_movie_id}
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
                <div style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.movie_title}
                  </span>
                  <button
                    onClick={(e) => handleRemoveItem(e, item, 'watched')}
                    title="Remove from watched"
                    style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'watchlist' ? (
        watchlist.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1rem' }}>Your watchlist is empty.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.5rem'
          }}>
            {watchlist.map((item) => (
              <div
                key={item.id || item.tmdb_movie_id}
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
                <div style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.movie_title}
                  </span>
                  <button
                    onClick={(e) => handleRemoveItem(e, item, 'watchlist')}
                    title="Remove from watchlist"
                    style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'reviewed' ? (
        <div>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1rem' }}>No reviews written yet.</p>
          ) : (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '1.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ArrowUpDown size={15} color="#737373" />
                  <span style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>Sort:</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    style={{
                      background: '#111111',
                      border: '1px solid #242424',
                      color: '#ffffff',
                      padding: '6px 12px',
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {sortedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onSelectMovie(rev.tmdb_movie_id)}
                    style={{
                      background: '#0d0d0d',
                      border: '1px solid #222222',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1.2rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#383838')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222222')}
                  >
                    <div style={{ width: '80px', flexShrink: 0, aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', background: '#141414' }}>
                      <img
                        src={getImageUrl(rev.movie_poster_path, 'w185')}
                        alt={rev.movie_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rev.movie_title}
                          </h3>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReview(rev);
                              }}
                              title="Edit review"
                              style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteReview(e, rev.id)}
                              title="Delete review"
                              style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? '#22c55e' : 'transparent'}
                              color={i < rev.rating ? '#22c55e' : '#333333'}
                            />
                          ))}
                          <span style={{ fontSize: '0.8rem', color: '#a3a3a3', marginLeft: '6px', fontWeight: 600 }}>
                            {rev.rating}/5
                          </span>
                        </div>

                        <p style={{
                          margin: 0,
                          fontSize: '0.88rem',
                          color: '#d4d4d4',
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Settings Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem', width: '100%' }}>
          {/* Display Name */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '2.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <User size={22} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Change Display Name</h3>
            </div>

            <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8a8a', marginBottom: '8px', fontWeight: 500 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter display name..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#121212',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {usernameStatus.msg && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: usernameStatus.type === 'success' ? '#22c55e' : '#ef4444' }}>
                  {usernameStatus.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={savingUsername}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {savingUsername ? 'Saving...' : 'Update Name'}
              </button>
            </form>
          </div>

          {/* Password */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '2.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <Lock size={22} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Change Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8a8a', marginBottom: '8px', fontWeight: 500 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#121212',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8a8a', marginBottom: '8px', fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#121212',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {passwordStatus.msg && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: passwordStatus.type === 'success' ? '#22c55e' : '#ef4444' }}>
                  {passwordStatus.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <KeyRound size={16} />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}