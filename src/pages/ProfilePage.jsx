import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import { User, Bookmark, Star, Trash2, Shield, ArrowLeft, Lock, KeyRound, ArrowUpDown, Eye, Camera, Loader2, X, Check, ZoomIn, ZoomOut } from 'lucide-react';

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
    return {
      width: baseW * currentZoom,
      height: baseH * currentZoom
    };
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
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
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
          background: '#0a0a0a',
          border: '1px solid #222222',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>Adjust Profile Picture</h3>
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
            border: '2px solid #ffffff',
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

        <p style={{ fontSize: '0.8rem', color: '#737373', margin: '1rem 0 1.25rem 0' }}>
          Drag image to reposition • Slider to zoom
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
              fontWeight: 500,
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
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} /> Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ onSelectMovie }) {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Avatar State
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

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
        setWatchlist(allLists.filter((item) => item.type === 'watchlist' || !item.type));
        setWatched(allLists.filter((item) => item.type === 'watched'));
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
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true
        });

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
      console.error('Failed to upload compressed avatar:', err);
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
        setUsernameStatus({ type: 'error', msg: 'This username is already taken. Please choose another.' });
        setSavingUsername(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('This username is already taken. Please choose another.');
        }
        throw updateError;
      }

      await refreshProfile();
      setUsernameStatus({ type: 'success', msg: 'Username updated successfully.' });
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

  const handleRemoveItem = async (e, id, type) => {
    e.stopPropagation();
    const { error } = await supabase.from('watchlists').delete().eq('id', id);
    if (!error) {
      if (type === 'watched') {
        setWatched((prev) => prev.filter((item) => item.id !== id));
      } else {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
      }
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
    <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '3rem 2rem 6rem 2rem' }}>
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

      {/* Profile Overview Header Card */}
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
          {/* Scaled Avatar */}
          <div
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            title="Click to change and crop avatar"
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
              <User size={38} />
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {profile?.username || user.email?.split('@')[0]}
              </h1>
              {profile?.role === 'admin' && (
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
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#737373' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Scaled Aggregate Stats */}
        <div style={{ display: 'flex', gap: '2.5rem' }}>
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
              Reviewed
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

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        borderBottom: '1px solid #1e1e1e',
        marginBottom: '2.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'profile' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'profile' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease'
          }}
        >
          <User size={18} /> Profile & Security
        </button>

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
          onClick={() => setActiveTab('reviewed')}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'reviewed' ? '#ffffff' : '#737373',
            borderBottom: activeTab === 'reviewed' ? '2px solid #ffffff' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease'
          }}
        >
          <Star size={18} /> Reviewed ({reviews.length})
        </button>
      </div>

      {/* Panels */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>Loading records...</p>
      ) : activeTab === 'profile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '2rem', width: '100%' }}>
          
          {/* Change Display Name */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '2.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <User size={22} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Change Display Name</h3>
            </div>
            
            <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a3a3a3', marginBottom: '8px', fontWeight: 500 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter display name..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#111111',
                    border: '1px solid #222222',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                {savingUsername ? 'Saving...' : 'Update Name'}
              </button>
            </form>
          </div>

          {/* Update Password */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '2.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <Lock size={22} color="#ffffff" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Update Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a3a3a3', marginBottom: '8px', fontWeight: 500 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#111111',
                    border: '1px solid #222222',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a3a3a3', marginBottom: '8px', fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#111111',
                    border: '1px solid #222222',
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
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                <KeyRound size={16} />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      ) : activeTab === 'watched' ? (
        watched.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>You have not logged any watched films yet.</p>
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
                <div style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.movie_title}
                  </span>
                  <button
                    onClick={(e) => handleRemoveItem(e, item.id, 'watched')}
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
          <p style={{ textAlign: 'center', color: '#737373', marginTop: '6rem', fontSize: '1.05rem' }}>Your watchlist is empty.</p>
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
                <div style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.movie_title}
                  </span>
                  <button
                    onClick={(e) => handleRemoveItem(e, item.id, 'watchlist')}
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
      ) : (
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
                          <button
                            onClick={(e) => handleDeleteReview(e, rev.id)}
                            style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
                          >
                            <Trash2 size={15} />
                          </button>
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