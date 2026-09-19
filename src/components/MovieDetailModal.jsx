import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  getMovieDetails,
  getMovieWatchProviders,
  getMovieRecommendations,
  getImageUrl
} from '../services/tmdb';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import {
  X,
  Star,
  Bookmark,
  Send,
  Share2,
  Check,
  Play,
  Eye,
  Heart,
  Tv,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  CornerDownRight,
  Pencil,
  Trash2
} from 'lucide-react';
import PersonDetailModal from './PersonDetailModal';
import CompanyDetailModal from './CompanyDetailModal';
import styles from './CSS/MovieDetailModal.module.css';

const getProviderLink = (providerName, movieTitle) => {
  const title = encodeURIComponent(movieTitle);
  const name = providerName.toLowerCase();

  if (name.includes('netflix')) return `https://www.netflix.com/search?q=${title}`;
  if (name.includes('amazon') || name.includes('prime')) return `https://www.amazon.com/s?k=${title}&i=instant-video`;
  if (name.includes('disney')) return `https://www.disneyplus.com/search?q=${title}`;
  if (name.includes('hulu')) return `https://www.hulu.com/search?q=${title}`;
  if (name.includes('apple')) return `https://tv.apple.com/search?term=${title}`;
  if (name.includes('max') || name.includes('hbo')) return `https://play.max.com/search?q=${title}`;
  if (name.includes('peacock')) return `https://www.peacocktv.com/watch/search?q=${title}`;
  if (name.includes('paramount')) return `https://www.paramountplus.com/search/?q=${title}`;
  if (name.includes('crunchyroll')) return `https://www.crunchyroll.com/search?q=${title}`;
  
  return `https://www.google.com/search?q=${encodeURIComponent(`Watch ${movieTitle} on ${providerName}`)}`;
};

function RecommendationMovieCard({ film, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  if (!film) return null;

  return (
    <div
      onClick={() => onSelect(film.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.recCard}
      style={{
        minWidth: '150px',
        maxWidth: '150px',
        backgroundColor: '#0a0a0a',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${isHovered ? '#383838' : '#1e1e1e'}`,
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease, box-shadow 0.18s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.65)' : 'none',
        flexShrink: 0
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: '#121212' }}>
        <img
          src={getImageUrl(film.poster_path, 'w342')}
          alt={film.title || 'Poster'}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)'
          }}
        />
      </div>

      <div style={{ padding: '0.65rem 0.75rem' }}>
        <h4
          style={{
            fontSize: '0.82rem',
            margin: '0 0 0.25rem 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isHovered ? '#ffffff' : '#e5e5e5',
            fontWeight: 500,
            transition: 'color 0.15s ease'
          }}
        >
          {film.title || 'Untitled'}
        </h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#737373' }}>
          <span>{film.release_date ? film.release_date.split('-')[0] : 'N/A'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#ffffff', fontWeight: 600 }}>
            <Star size={11} fill="#ffffff" />
            {film.vote_average ? film.vote_average.toFixed(1) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ThreadReplyItem({ reply, onTargetReply, activeTargetId, depth = 0, currentUser, onToggleLike, onEdit, onDelete }) {
  const isDeleted = reply.reply_text === '[deleted]';
  const authorData = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles || {};
  const username = isDeleted ? '[deleted]' : (authorData.username || 'user');
  const avatar = isDeleted ? null : authorData.avatar_url;
  const isTargeted = activeTargetId === reply.id;

  const likes = reply.review_reply_likes || [];
  const likeCount = likes.length;
  const isLikedByMe = currentUser && likes.some(l => l.user_id === currentUser.id);
  const isMine = currentUser && currentUser.id === reply.user_id;
  const isEdited = Boolean(reply.updated_at) && !isDeleted;

  return (
    <div className={depth > 0 ? styles.threadReplyNested : styles.threadReplyRoot}>
      <div className={`${styles.replyCard} ${isTargeted ? styles.replyCardTargeted : ''}`}>
        <div className={`${styles.replyAvatar} ${isDeleted ? styles.replyAvatarDeleted : ''}`}>
          {avatar ? <img src={avatar} alt={username} /> : <span>{isDeleted ? 'X' : username.charAt(0).toUpperCase()}</span>}
        </div>
        <div className={styles.replyContent}>
          <div className={styles.replyTopBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={isDeleted ? styles.replyDeletedText : styles.replyUsername}>{username}</span>
              {isEdited && <span className={styles.editedBadge}>(edited)</span>}
            </div>
            
            {isMine && !isDeleted && (
              <div className={styles.replyActionsRight}>
                <button onClick={() => onEdit(reply)} className={styles.replyActionBtn} title="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(reply.id)} className={`${styles.replyActionBtn} ${styles.replyActionBtnDelete}`} title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
          <p className={isDeleted ? styles.replyDeletedText : styles.replyText}>
            {isDeleted ? '[This reply was deleted]' : reply.reply_text}
          </p>
          
          {!isDeleted && (
            <div className={styles.replyActionsRow}>
              <button
                type="button"
                onClick={() => onToggleLike(reply.id, isLikedByMe)}
                className={`${styles.replyInlineBtn} ${isLikedByMe ? styles.likedText : ''}`}
              >
                <Heart size={12} fill={isLikedByMe ? '#ef4444' : 'transparent'} color={isLikedByMe ? '#ef4444' : 'currentColor'} />
                <span>{likeCount > 0 ? likeCount : 'Like'}</span>
              </button>
              <button
                type="button"
                onClick={() => onTargetReply(reply)}
                className={styles.replyInlineBtn}
              >
                <CornerDownRight size={12} />
                <span>Reply</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {reply.children && reply.children.length > 0 && (
        <div className={styles.childRepliesContainer}>
          {reply.children.map((child) => (
            <ThreadReplyItem
              key={child.id}
              reply={child}
              onTargetReply={onTargetReply}
              activeTargetId={activeTargetId}
              depth={depth + 1}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RepliesOverlay({ review, onClose }) {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyTarget, setReplyTarget] = useState(null); 
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchReplies() {
      try {
        const { data, error } = await supabase
          .from('review_replies')
          .select('*, profiles(username, avatar_url), review_reply_likes(user_id)')
          .eq('review_id', review.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (isMounted) setReplies(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchReplies();
    return () => { isMounted = false; };
  }, [review.id]);

  const threadedReplies = useMemo(() => {
    const map = new Map();
    const roots = [];

    replies.forEach((r) => {
      map.set(r.id, { ...r, children: [] });
    });

    replies.forEach((r) => {
      const node = map.get(r.id);
      if (r.parent_reply_id && map.has(r.parent_reply_id)) {
        map.get(r.parent_reply_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [replies]);

  const handleSetReplyTarget = (target) => {
    if (editingReplyId) {
      setEditingReplyId(null);
      setNewReply('');
    }
    setReplyTarget(target);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleEditClick = (reply) => {
    setReplyTarget(null);
    setEditingReplyId(reply.id);
    setNewReply(reply.reply_text);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDeleteClick = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      const hasChildren = replies.some(r => r.parent_reply_id === replyId);

      if (hasChildren) {
        const { data, error } = await supabase
          .from('review_replies')
          .update({ reply_text: '[deleted]' })
          .eq('id', replyId)
          .select('*, profiles(username, avatar_url), review_reply_likes(user_id)')
          .single();

        if (error) throw error;
        setReplies(prev => prev.map(r => r.id === replyId ? data : r));
      } else {
        const { error } = await supabase.from('review_replies').delete().eq('id', replyId);
        if (error) throw error;
        setReplies(prev => prev.filter(r => r.id !== replyId));
      }

      if (editingReplyId === replyId) {
        setEditingReplyId(null);
        setNewReply('');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deleting reply');
    }
  };

  const handleToggleLike = async (replyId, currentlyLiked) => {
    if (!user) return alert('Please sign in to like replies.');

    setReplies(current => current.map(r => {
      if (r.id === replyId) {
        const likes = r.review_reply_likes || [];
        return {
          ...r,
          review_reply_likes: currentlyLiked
            ? likes.filter(l => l.user_id !== user.id)
            : [...likes, { user_id: user.id }]
        };
      }
      return r;
    }));

    try {
      if (currentlyLiked) {
        await supabase.from('review_reply_likes').delete().eq('reply_id', replyId).eq('user_id', user.id);
      } else {
        await supabase.from('review_reply_likes').insert({ reply_id: replyId, user_id: user.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to reply.');
    if (!newReply.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      if (editingReplyId) {
        const { data, error } = await supabase
          .from('review_replies')
          .update({ reply_text: newReply, updated_at: new Date().toISOString() })
          .eq('id', editingReplyId)
          .select('*, profiles(username, avatar_url), review_reply_likes(user_id)')
          .single();

        if (error) throw error;
        if (data) setReplies(prev => prev.map(r => r.id === editingReplyId ? data : r));
        setEditingReplyId(null);
      } else {
        const payload = { 
          review_id: review.id, 
          user_id: user.id, 
          reply_text: newReply,
          parent_reply_id: replyTarget ? replyTarget.id : null
        };

        const { data, error } = await supabase
          .from('review_replies')
          .insert([payload])
          .select('*, profiles(username, avatar_url), review_reply_likes(user_id)')
          .single();

        if (error) throw error;
        if (data) setReplies(prev => [...prev, data]);
      }
      
      setNewReply('');
      setReplyTarget(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving reply');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewAuthor = review.profiles?.[0]?.username || review.profiles?.username || 'user';
  const targetAuthor = replyTarget ? (replyTarget.profiles?.username || replyTarget.profiles?.[0]?.username || 'user') : null;

  return (
    <div className={styles.overlayBackdrop} onClick={onClose}>
      <div className={styles.overlayContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Replies to {reviewAuthor}</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close replies">
            <X size={20} />
          </button>
        </div>

        <div className={styles.replyFeed}>
          {loading ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Loading thread...</p>
          ) : threadedReplies.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>No replies yet. Start the conversation!</p>
          ) : (
            threadedReplies.map((rootReply) => (
              <ThreadReplyItem
                key={rootReply.id}
                reply={rootReply}
                onTargetReply={handleSetReplyTarget}
                activeTargetId={replyTarget?.id}
                depth={0}
                currentUser={user}
                onToggleLike={handleToggleLike}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>

        {replyTarget && !editingReplyId && (
          <div className={styles.replyTargetNotice}>
            <span>Replying to <strong>@{targetAuthor}</strong></span>
            <button type="button" onClick={() => setReplyTarget(null)} className={styles.cancelTargetBtn}>
              <X size={13} />
            </button>
          </div>
        )}

        {editingReplyId && (
          <div className={styles.replyTargetNotice}>
            <span>Editing your reply...</span>
            <button type="button" onClick={() => { setEditingReplyId(null); setNewReply(''); }} className={styles.cancelTargetBtn}>
              <X size={13} />
            </button>
          </div>
        )}

        <form className={styles.inputArea} onSubmit={handleSubmit}>
          <input 
            ref={inputRef}
            type="text" 
            placeholder={
              !user 
                ? 'Sign in to reply' 
                : editingReplyId
                ? 'Update your reply...'
                : replyTarget 
                ? `Replying to @${targetAuthor}...` 
                : 'Write a reply...'
            } 
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={!user || submitting}
          />
          <button type="submit" disabled={!user || !newReply.trim() || submitting} className={styles.sendButton}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MovieDetailModal({ movieId, onClose, stackLevel = 0 }) {
  const { user, profile, refreshProfile } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [nestedMovieId, setNestedMovieId] = useState(null);
  const [reviewSort, setReviewSort] = useState('newest'); 

  const [rating, setRating] = useState(4.0);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [activeReplyReview, setActiveReplyReview] = useState(null);

  const [watchProviders, setWatchProviders] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const modalContentRef = useRef(null);
  const numericMovieId = Number(movieId);

  useEffect(() => {
    if (!numericMovieId) return;
    const count = parseInt(document.body.dataset.modalLockCount || '0', 10);
    document.body.dataset.modalLockCount = count + 1;
    document.body.style.overflow = 'hidden';
    
    return () => {
      const nextCount = Math.max(0, parseInt(document.body.dataset.modalLockCount || '0', 10) - 1);
      document.body.dataset.modalLockCount = nextCount;
      if (nextCount === 0) document.body.style.overflow = '';
    };
  }, [numericMovieId]);

  useEffect(() => {
    if (!numericMovieId) return;

    let isMounted = true;
    setMovie(null);
    setWatchProviders(null);
    setRecommendations([]);
    setReviews([]);
    setIsWatched(false);
    setInWatchlist(false);
    setLoading(true);
    setIsReviewModalOpen(false);

    if (modalContentRef.current) modalContentRef.current.scrollTop = 0;

    async function loadData() {
      try {
        const [details, providersData, recsData, revResponse, listResponse] = await Promise.all([
          getMovieDetails(numericMovieId),
          getMovieWatchProviders(numericMovieId),
          getMovieRecommendations(numericMovieId),
          supabase
            .from('reviews')
            .select('*, profiles(username, avatar_url), review_likes(user_id), review_replies(count)')
            .eq('tmdb_movie_id', numericMovieId)
            .order('created_at', { ascending: false }),
          user
            ? supabase
                .from('watchlists')
                .select('id, type')
                .eq('user_id', user.id)
                .eq('tmdb_movie_id', numericMovieId)
            : Promise.resolve({ data: [] })
        ]);

        if (!isMounted) return;

        setMovie(details);
        setWatchProviders(
          providersData?.US ||
          providersData?.IN ||
          providersData?.GB ||
          Object.values(providersData || {})[0] ||
          null
        );
        setRecommendations(recsData || []);

        const revData = revResponse?.data || [];
        setReviews(revData);

        if (user) {
          const listData = listResponse?.data || [];
          const hasWatchedRow = listData.some((item) => item.type === 'watched');
          const hasUserReviewed = revData.some((r) => r.user_id === user.id);
          const hasWatchlistRow = listData.some((item) => item.type === 'watchlist' || !item.type);

          const watchedStatus = Boolean(hasWatchedRow || hasUserReviewed);
          setIsWatched(watchedStatus);
          setInWatchlist(!watchedStatus && Boolean(hasWatchlistRow));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [numericMovieId, user]);

  useEffect(() => {
    const favs = Array.isArray(profile?.favorite_movies) ? profile.favorite_movies : [];
    setIsFavorited(favs.some((m) => m.tmdb_movie_id === numericMovieId));
  }, [profile, numericMovieId]);

  useEffect(() => {
    if (loading || reviews.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    let targetReviewId = params.get('review');
    
    const sessionTarget = sessionStorage.getItem('scrollToReview');
    if (sessionTarget) {
      targetReviewId = sessionTarget;
      sessionStorage.removeItem('scrollToReview');
    }

    if (targetReviewId) {
      setTimeout(() => {
        const reviewWrapper = document.getElementById(`review-${targetReviewId}`);
        if (reviewWrapper?.firstElementChild) {
          reviewWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const cardElement = reviewWrapper.firstElementChild;
          const originalTransition = cardElement.style.transition;
          cardElement.style.transition = 'all 0.4s ease';
          cardElement.style.borderColor = '#ef4444';
          cardElement.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.25)';
          cardElement.style.transform = 'scale(1.02)';
          
          setTimeout(() => {
            cardElement.style.borderColor = '';
            cardElement.style.boxShadow = '';
            cardElement.style.transform = '';
            setTimeout(() => { cardElement.style.transition = originalTransition; }, 400);
          }, 2000);
        }
      }, 300);
    }
  }, [loading, reviews]);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('movie', movieId);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url.toString());
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url.toString();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMovie = (newMovieId) => {
    setNestedMovieId(newMovieId);
  };

  const toggleWatchlist = async () => {
    if (!user) return;
    if (inWatchlist) {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', numericMovieId).or('type.eq.watchlist,type.is.null');
      setInWatchlist(false);
    } else {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', numericMovieId).eq('type', 'watched');
      await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: numericMovieId,
        movie_title: movie?.title || '',
        movie_poster_path: movie?.poster_path || '',
        type: 'watchlist'
      });
      setInWatchlist(true);
      if (isWatched) setIsWatched(false);
    }
  };

  const toggleWatched = async () => {
    if (!user) return;
    if (isWatched) {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', numericMovieId).eq('type', 'watched');
      setIsWatched(false);
    } else {
      await supabase.from('watchlists').insert({
        user_id: user.id,
        tmdb_movie_id: numericMovieId,
        movie_title: movie?.title || '',
        movie_poster_path: movie?.poster_path || '',
        type: 'watched'
      });
      setIsWatched(true);
      if (inWatchlist) {
        await supabase.from('watchlists').delete().eq('user_id', user.id).eq('tmdb_movie_id', numericMovieId).or('type.eq.watchlist,type.is.null');
        setInWatchlist(false);
      }
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    const currentFavs = Array.isArray(profile?.favorite_movies) ? profile.favorite_movies : [];
    let updatedFavs;

    if (isFavorited) {
      updatedFavs = currentFavs.filter((m) => m.tmdb_movie_id !== numericMovieId);
    } else {
      if (currentFavs.length >= 4) return alert('You can only have 4 favorite films.');
      updatedFavs = [...currentFavs, { tmdb_movie_id: numericMovieId, title: movie?.title || '', poster_path: movie?.poster_path || '' }];
    }

    try {
      await supabase.from('profiles').update({ favorite_movies: updatedFavs }).eq('id', user.id);
      setIsFavorited(!isFavorited);
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      if (editingReviewId) {
        const { data, error } = await supabase
          .from('reviews')
          .update({ rating: parseFloat(rating), review_text: reviewText, contains_spoilers: containsSpoilers })
          .eq('id', editingReviewId)
          .select('*, profiles(username, avatar_url), review_likes(user_id), review_replies(count)')
          .single();

        if (error) throw error;
        if (data) setReviews((prev) => prev.map((r) => (r.id === editingReviewId ? data : r)));
        setEditingReviewId(null);
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            tmdb_movie_id: numericMovieId,
            movie_title: movie?.title || '',
            movie_poster_path: movie?.poster_path || '',
            rating: parseFloat(rating),
            review_text: reviewText,
            contains_spoilers: containsSpoilers
          })
          .select('*, profiles(username, avatar_url), review_likes(user_id), review_replies(count)')
          .single();

        if (error) throw error;
        if (data) {
          setReviews([data, ...reviews]);
          setIsWatched(true);
          setInWatchlist(false);
        }
      }
      
      setReviewText('');
      setContainsSpoilers(false);
      setIsReviewModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (!error) setReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating || 0);
    setReviewText(review.review_text || '');
    setContainsSpoilers(Boolean(review.contains_spoilers));
    setIsReviewModalOpen(true);
  };

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    switch (reviewSort) {
      case 'highest': return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'lowest': return arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'most_liked': return arr.sort((a, b) => (b.review_likes?.length || 0) - (a.review_likes?.length || 0));
      case 'most_discussed': return arr.sort((a, b) => (b.review_replies?.[0]?.count || 0) - (a.review_replies?.[0]?.count || 0));
      case 'newest':
      default: return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviews, reviewSort]);

  if (!movieId) return null;

  const communityAverage = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const posterSrc = movie ? getImageUrl(movie.poster_path, 'w500') : '';
  const backdropSrc = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, 'w1280') : null;
  const director = movie?.credits?.crew?.find((c) => c.job === 'Director')?.name;
  const topCast = movie?.credits?.cast?.slice(0, 12) || [];
  const studios = movie?.production_companies || [];

  const streamProviders = watchProviders?.flatrate || watchProviders?.ads || [];
  const rentBuyProviders = [...(watchProviders?.rent || []), ...(watchProviders?.buy || [])];
  const uniqueRentBuy = Array.from(new Map(rentBuyProviders.map((p) => [p.provider_id, p])).values());

  const videos = movie?.videos?.results || [];
  const youtubeTrailers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const trailer = youtubeTrailers[0] || videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const computedZIndex = 1000 + stackLevel * 50;

  return (
    <div onClick={onClose} className={styles.backdrop} style={{ zIndex: computedZIndex }}>
      <div ref={modalContentRef} onClick={(e) => e.stopPropagation()} className={styles.modal}>
        
        {loading || !movie ? (
          <div className={`${styles.backdropImage} skeleton-box`} style={{ opacity: 0.15 }} />
        ) : backdropSrc ? (
          <div className={styles.backdropImage} style={{ backgroundImage: `url(${backdropSrc})` }} />
        ) : null}

        {!loading && movie && <div className={styles.vignetteOverlay} />}

        <div className={styles.topControls}>
          {copied && (
            <div className={styles.copiedBadge}>
              <Check size={13} color="#22c55e" />
              <span>Link copied</span>
            </div>
          )}
          <button onClick={handleShare} title="Copy link" className={styles.controlBtn}>
            <Share2 size={15} />
          </button>
          <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.contentWrapper}>
          {loading || !movie ? (
            <div className={styles.hero}>
              <div className={styles.leftCol}>
                <div className={`skeleton-box ${styles.poster}`} style={{ aspectRatio: '2/3', border: 'none', boxShadow: 'none' }} />
                <div className={styles.heroActions}>
                  <div className="skeleton-box" style={{ height: '44px', width: '100%', borderRadius: '8px' }} />
                  <div className="skeleton-box" style={{ height: '38px', width: '100%', borderRadius: '8px' }} />
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.heroHeader}>
                  <div className="skeleton-box" style={{ height: '48px', width: '70%', borderRadius: '8px', marginBottom: '8px' }} />
                </div>
                
                <div className={styles.heroBody}>
                  <div className="skeleton-box" style={{ height: '18px', width: '40%', borderRadius: '6px', marginBottom: '16px' }} />
                  
                  <div className={styles.genrePills}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: '26px', width: '65px', borderRadius: '6px' }} />)}
                  </div>

                  <div className={styles.metadataVertical} style={{ marginTop: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div style={{ display: 'contents' }} key={i}>
                        <div className="skeleton-box" style={{ height: '14px', width: '70px', borderRadius: '4px' }} />
                        <div className="skeleton-box" style={{ height: '16px', width: '120px', borderRadius: '4px' }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
                    <div className="skeleton-box" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
                    <div className="skeleton-box" style={{ height: '16px', width: '94%', borderRadius: '4px' }} />
                    <div className="skeleton-box" style={{ height: '16px', width: '97%', borderRadius: '4px' }} />
                    <div className="skeleton-box" style={{ height: '16px', width: '60%', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.hero}>
                <div className={styles.leftCol}>
                  <img src={posterSrc} alt={movie.title} className={styles.poster} />
                  
                  <div className={styles.heroActions}>
                    <button 
                      onClick={() => {
                        if (!user) return alert('Please sign in to log a film.');
                        setIsReviewModalOpen(true);
                      }} 
                      className={styles.mainLogBtn}
                    >
                      Rate, Log, Review...
                    </button>
                    
                    {trailer && (
                      <button onClick={() => setIsPlayingTrailer(true)} className={styles.trailerBtn}>
                        <Play size={14} fill="currentColor" /> Watch Trailer
                      </button>
                    )}
                  </div>

                  {(streamProviders.length > 0 || uniqueRentBuy.length > 0) && (
                    <div className={styles.watchProvidersCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
                        <Tv size={16} color="#ffffff" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', textTransform: 'uppercase' }}>
                          Where to Watch
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {streamProviders.length > 0 && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#8a8a8a', marginBottom: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>Stream</span>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {streamProviders.map((prov) => (
                                <a 
                                  href={getProviderLink(prov.provider_name, movie.title)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  key={prov.provider_id} 
                                  title={prov.provider_name} 
                                  className={styles.providerLogo}
                                >
                                  <img src={getImageUrl(prov.logo_path, 'w92')} alt={prov.provider_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {uniqueRentBuy.length > 0 && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#8a8a8a', marginBottom: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>Rent / Buy</span>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {uniqueRentBuy.slice(0, 8).map((prov) => (
                                <a 
                                  href={getProviderLink(prov.provider_name, movie.title)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  key={prov.provider_id} 
                                  title={prov.provider_name} 
                                  className={styles.providerLogo}
                                >
                                  <img src={getImageUrl(prov.logo_path, 'w92')} alt={prov.provider_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.rightCol}>
                  <div className={styles.heroHeader}>
                    <h1 className={styles.movieTitle}>{movie.title}</h1>
                    <p className={styles.releaseYearMobile}>{movie.release_date?.split('-')[0]}</p>
                  </div>
                  
                  <div className={styles.heroBody}>
                    {movie.tagline && <p className={styles.tagline}>{movie.tagline}</p>}

                    <div className={styles.genrePills}>
                      {movie.genres?.map((g) => (
                        <span key={g.id} className={styles.genrePill}>{g.name}</span>
                      ))}
                    </div>

                    <div className={styles.metadataVertical}>
                      {director && (
                        <>
                          <span className={styles.metaLabel}>Directed By</span>
                          <div className={styles.metaValue}>
                            <span onClick={() => setSelectedPersonId(movie.credits.crew.find(c => c.job === 'Director')?.id)} className={styles.metaLink}>
                              {director}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {studios.length > 0 && (
                        <>
                          <span className={styles.metaLabel}>Studios</span>
                          <div className={styles.metaValue}>
                            {studios.slice(0, 3).map((comp, idx) => (
                              <span key={comp.id} onClick={() => setSelectedCompanyId(comp.id)} className={styles.metaLink}>
                                {comp.name}{idx < Math.min(studios.length, 3) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      <>
                        <span className={styles.metaLabel}>Released</span>
                        <div className={styles.metaValue}>{movie.release_date || 'N/A'}</div>
                      </>

                      {movie.runtime > 0 && (
                        <>
                          <span className={styles.metaLabel}>Runtime</span>
                          <div className={styles.metaValue}>{movie.runtime} mins</div>
                        </>
                      )}

                      <>
                        <span className={styles.metaLabel}>TMDB</span>
                        <div className={styles.metaValue}>
                          <Star size={12} fill="currentColor" /> {movie.vote_average?.toFixed(1)} / 10
                        </div>
                      </>

                      <>
                        <span className={styles.metaLabel}>Community</span>
                        <div className={styles.metaValue}>
                          <Star size={12} fill="currentColor" /> {communityAverage || 'No ratings'}
                        </div>
                      </>
                    </div>
                    
                    <p className={styles.overview}>{movie.overview || 'No description available.'}</p>
                  </div>
                </div>
              </div>

              {topCast.length > 0 && (
                <div style={{ marginTop: '3.5rem' }}>
                  <span className={styles.sectionHeading}>Top Cast</span>
                  <div className={styles.carouselTrack}>
                    {topCast.map((actor) => (
                      <div key={actor.id} onClick={() => setSelectedPersonId(actor.id)} className={styles.castCard}>
                        <div className={styles.castAvatarWrap}>
                          {actor.profile_path ? (
                            <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252', fontSize: '0.9rem' }}>N/A</div>
                          )}
                        </div>
                        <p className={styles.castName}>{actor.name}</p>
                        <p className={styles.castRole}>{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
                    <Sparkles size={15} color="#ffffff" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Recommended Films</span>
                  </div>
                  <div className={styles.recsTrack}>
                    {recommendations.map((rec) => (
                      <RecommendationMovieCard key={rec.id} film={rec} onSelect={handleSelectMovie} />
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: '#1f1f1f', margin: '3.5rem 0' }} />

              <div style={{ width: '100%', paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Reviews ({reviews.length})
                  </h3>
                  
                  <div className={styles.sortWrapper}>
                    <span className={styles.sortLabel}>Sort by:</span>
                    <div className={styles.selectContainer}>
                      <select 
                        value={reviewSort} 
                        onChange={(e) => setReviewSort(e.target.value)}
                        className={styles.sortSelect}
                      >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                        <option value="most_liked">Most Liked</option>
                        <option value="most_discussed">Most Discussed</option>
                      </select>
                      <ChevronDown size={14} className={styles.selectIcon} />
                    </div>
                  </div>
                </div>

                {sortedReviews.length === 0 ? (
                  <p style={{ color: '#737373', fontSize: '1.05rem' }}>No reviews yet. Be the first to review!</p>
                ) : (
                  <div className={styles.reviewsGrid}>
                    {sortedReviews.map((rev) => (
                      <div key={rev.id} id={`review-${rev.id}`}>
                        <ReviewCard
                          review={rev}
                          onDelete={handleDeleteReview}
                          onEdit={user?.id === rev.user_id ? handleEditReview : undefined}
                          showMoviePoster={false}
                          onCloseModal={onClose}
                          onOpenReplies={() => setActiveReplyReview(rev)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {isReviewModalOpen && (
          <div className={styles.subModalBackdrop} onClick={() => {
            setIsReviewModalOpen(false);
            if (editingReviewId) {
              setEditingReviewId(null);
              setReviewText('');
              setRating(4.0);
            }
          }}>
            <div className={styles.subModal} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>I Watched...</h3>
                <button onClick={() => setIsReviewModalOpen(false)} className={styles.subModalClose}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.logTogglesRow}>
                <button onClick={toggleWatched} className={`${styles.logToggleBtn} ${isWatched ? styles.activeEye : ''}`}>
                  <Eye size={18} fill={isWatched ? 'currentColor' : 'none'} />
                  <span>Watched</span>
                </button>
                <button onClick={toggleFavorite} className={`${styles.logToggleBtn} ${isFavorited ? styles.activeHeart : ''}`}>
                  <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  <span>Favorite</span>
                </button>
                <button onClick={toggleWatchlist} className={`${styles.logToggleBtn} ${inWatchlist ? styles.activeWatchlist : ''}`}>
                  <Bookmark size={18} fill={inWatchlist ? 'currentColor' : 'none'} />
                  <span>Watchlist</span>
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#a3a3a3', fontWeight: 600 }}>Rating</span>
                  <StarRating rating={rating} onChange={(val) => setRating(val)} size={28} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{rating.toFixed(1)}</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={5}
                    maxLength={1000}
                    placeholder="Add a review..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      width: '100%', background: '#111111', border: '1px solid #2a2a2a', borderRadius: '10px',
                      padding: '16px', color: '#ffffff', fontSize: '1rem', lineHeight: '1.6', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '0.75rem', fontWeight: 600, color: reviewText.length >= 950 ? '#ef4444' : '#666666' }}>
                    {reviewText.length} / 1000
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: containsSpoilers ? '#ffffff' : '#a3a3a3' }}>
                    <input
                      type="checkbox"
                      checked={containsSpoilers}
                      onChange={(e) => setContainsSpoilers(e.target.checked)}
                      style={{ accentColor: '#ffffff', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {containsSpoilers && <AlertTriangle size={14} color="#eab308" />} Contains spoilers
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitReviewBtn}
                  >
                    <Send size={16} /> {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isPlayingTrailer && trailer && (
          <div onClick={() => setIsPlayingTrailer(false)} className={styles.trailerBackdrop}>
            <div onClick={(e) => e.stopPropagation()} className={styles.trailerBox}>
              <button onClick={() => setIsPlayingTrailer(false)} className={styles.trailerCloseBtn}><X size={20} /></button>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
                title="Trailer"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {selectedPersonId && (
          <PersonDetailModal 
            personId={selectedPersonId} 
            onClose={() => setSelectedPersonId(null)} 
            onSelectMovie={handleSelectMovie} 
          />
        )}
        
        {selectedCompanyId && (
          <CompanyDetailModal 
            companyId={selectedCompanyId} 
            onClose={() => setSelectedCompanyId(null)} 
            onSelectMovie={handleSelectMovie} 
          />
        )}

        {nestedMovieId && (
          <MovieDetailModal
            movieId={nestedMovieId}
            onClose={() => setNestedMovieId(null)}
            stackLevel={stackLevel + 1}
          />
        )}

        {activeReplyReview && (
          <RepliesOverlay 
            review={activeReplyReview} 
            onClose={() => setActiveReplyReview(null)} 
          />
        )}
      </div>
    </div>
  );
}