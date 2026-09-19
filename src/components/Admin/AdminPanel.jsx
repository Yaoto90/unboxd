import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { getImageUrl } from '../../services/tmdb';
import StarRating from '../StarRating';
import { 
  ShieldAlert, ArrowLeft, LayoutDashboard, Users, 
  Star, MessageSquare, Trash2, ShieldCheck, ShieldOff,
  User as UserIcon, Heart, X, Search, Filter,
  Sparkles, Flame, Film, RotateCcw, Calendar, ChevronDown,
  MessageCircle, Clock, Activity, PieChart, BarChart2,
  Inbox, Send, CornerUpLeft, Mail
} from 'lucide-react';
import styles from './CSS/AdminPanel.module.css';

const DECADES = [
  { id: '2020', label: '2020s', years: [2026, 2025, 2024, 2023, 2022, 2021, 2020] },
  { id: '2010', label: '2010s', years: [2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010] },
  { id: '2000', label: '2000s', years: [2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000] },
  { id: '1990', label: '1990s', years: [1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990] },
  { id: '1980', label: '1980s', years: [1989, 1988, 1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980] },
  { id: '1970', label: '1970s', years: [1979, 1978, 1977, 1976, 1975, 1974, 1973, 1972, 1971, 1970] }
];

const TIME_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'year', label: 'This Year' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' }
];

const RATING_OPTIONS = [
  { id: 'highest', label: 'Top Rated' },
  { id: 'lowest', label: 'Lowest Rated' }
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'most-popular', label: 'Most Popular' },
  { id: 'least-popular', label: 'Least Popular' },
  { id: 'most-likes', label: 'Most Liked' },
  { id: 'most-replies', label: 'Most Replied' },
  { id: 'rating-high', label: 'Highest Rating' },
  { id: 'rating-low', label: 'Lowest Rating' }
];

const GENRES = [
  { id: '28', name: 'Action' }, { id: '12', name: 'Adventure' }, { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' }, { id: '80', name: 'Crime' }, { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' }, { id: '14', name: 'Fantasy' }, { id: '27', name: 'Horror' },
  { id: '9648', name: 'Mystery' }, { id: '10749', name: 'Romance' }, { id: '878', name: 'Sci-Fi' },
  { id: '53', name: 'Thriller' }
];

const MOCK_WEEK_ACTIVITY = [
  { day: 'Mon', value: 35 },
  { day: 'Tue', value: 50 },
  { day: 'Wed', value: 85 },
  { day: 'Thu', value: 40 },
  { day: 'Fri', value: 65 },
  { day: 'Sat', value: 95 },
  { day: 'Sun', value: 75 },
];

function GlassButton({ children, onClick, active, style, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${styles.glassBtn} ${active ? styles.glassBtnActive : ''} ${disabled ? styles.glassBtnDisabled : ''}`}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}

function AdminReplyMessageModal({ message, onClose, onSubmit }) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    await onSubmit(message.id, replyText);
    setIsSubmitting(false);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Reply to {message.name || 'User'}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.msgContextBlock}>
            <strong>Subject:</strong> {message.subject || 'No Subject'}
            <p>"{message.message}"</p>
          </div>
          <textarea
            className={styles.glassTextarea}
            placeholder="Type your official admin response here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !replyText.trim()}
              className={styles.glassApplyBtn}
            >
              <Send size={15} /> {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminRepliesModal({ review, onClose }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('review_replies')
      .select('*, profiles(username, avatar_url)')
      .eq('review_id', review.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setReplies(data);
        setLoading(false);
      });
  }, [review.id]);

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    const { error } = await supabase.from('review_replies').delete().eq('id', replyId);
    if (!error) setReplies(prev => prev.filter(r => r.id !== replyId));
    else alert('Failed to delete reply: ' + error.message);
  };

  const threadedReplies = useMemo(() => {
    const map = new Map();
    const roots = [];
    replies.forEach(r => map.set(r.id, { ...r, children: [] }));
    
    replies.forEach(r => {
      const node = map.get(r.id);
      if (r.parent_reply_id && map.has(r.parent_reply_id)) {
        map.get(r.parent_reply_id).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [replies]);

  const renderThread = (reply, depth = 0) => (
    <div key={reply.id} className={depth > 0 ? styles.threadNested : ''}>
      <div className={styles.threadCard} style={{ marginBottom: '1rem' }}>
        <div className={styles.threadHeader}>
          <div className={styles.threadUserInfo}>
            <div className={styles.threadAvatar}>
              {reply.profiles?.avatar_url ? (
                <img src={reply.profiles.avatar_url} alt="avatar" />
              ) : (
                <UserIcon size={14} color="#a3a3a3" />
              )}
            </div>
            <span className={styles.threadUsername}>{reply.profiles?.username || 'Anonymous'}</span>
            <span className={styles.threadDate}>{new Date(reply.created_at).toLocaleString()}</span>
          </div>
          <button onClick={() => handleDeleteReply(reply.id)} className={styles.dangerBtn} title="Delete Reply">
            <Trash2 size={14} />
          </button>
        </div>
        <div className={styles.threadBody}>
          <p>{reply.reply_text}</p>
        </div>
      </div>
      {reply.children.map(child => renderThread(child, depth + 1))}
    </div>
  );

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Replies for {review.profiles?.username || 'Unknown'}'s Review</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>Loading replies...</div>
          ) : threadedReplies.length === 0 ? (
            <div className={styles.emptyState}>No replies found on this review.</div>
          ) : (
            threadedReplies.map(r => renderThread(r, 0))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminReviewFilterModal({ onClose, filterState, onApplyFilters }) {
  const [localState, setLocalState] = useState({ ...filterState });
  const [openDecadeId, setOpenDecadeId] = useState(null);
  const decadeContainerRef = useRef(null);

  useEffect(() => {
    const currentCount = parseInt(document.body.dataset.modalLockCount || '0', 10);
    document.body.dataset.modalLockCount = currentCount + 1;
    document.body.style.overflow = 'hidden';
    
    return () => {
      const nextCount = Math.max(0, parseInt(document.body.dataset.modalLockCount || '0', 10) - 1);
      document.body.dataset.modalLockCount = nextCount;
      if (nextCount === 0) document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (decadeContainerRef.current && !decadeContainerRef.current.contains(e.target)) {
        setOpenDecadeId(null);
      }
    };
    if (openDecadeId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDecadeId]);

  const handleClear = () => {
    setLocalState({
      query: '', sort: 'newest', time: 'all', rating: null,
      era: { type: null, value: null }, genres: []
    });
  };

  const handleApply = () => {
    onApplyFilters(localState);
    onClose();
  };

  const toggleGenre = (gId) => {
    setLocalState(prev => ({
      ...prev,
      genres: prev.genres.includes(gId) ? prev.genres.filter(id => id !== gId) : [...prev.genres, gId]
    }));
  };

  const hasChanges = JSON.stringify(localState) !== JSON.stringify({
    query: '', sort: 'newest', time: 'all', rating: null, era: { type: null, value: null }, genres: []
  });

  return (
    <div className={styles.glassBackdrop} onClick={onClose}>
      <div className={styles.glassModal} onClick={e => e.stopPropagation()}>
        <div className={styles.glassHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#ffffff" />
            <span className={styles.glassHeaderTitle}>FILTER & SORT REVIEWS</span>
          </div>
          <button onClick={onClose} aria-label="Close" className={styles.glassCloseBtn}><X size={15} /></button>
        </div>

        <div className={styles.glassModalBody}>
          <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
            <input
              type="text"
              placeholder="Search by movie title, review text, or username..."
              value={localState.query}
              onChange={(e) => setLocalState({ ...localState, query: e.target.value })}
              className={styles.glassSearchInput}
            />
            <Search size={16} className={styles.glassSearchIcon} />
          </div>

          <div style={{ marginBottom: '1.4rem' }} ref={decadeContainerRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
              <Calendar size={13} color="#ffffff" />
              <span className={styles.glassSectionHeader}>RELEASE ERA</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem', position: 'relative' }}>
              {DECADES.map((d) => {
                const isOpen = openDecadeId === d.id;
                const isDecadeSelected = localState.era.type === 'decade' && localState.era.value === d.id;
                const isYearSelected = localState.era.type === 'year' && d.years.includes(Number(localState.era.value));
                const isActive = isDecadeSelected || isYearSelected;

                return (
                  <div key={d.id} style={{ position: 'relative' }}>
                    <GlassButton
                      active={isActive || isOpen}
                      onClick={() => setOpenDecadeId(isOpen ? null : d.id)}
                      style={{ width: '100%', justifyContent: 'space-between' }}
                    >
                      <span>{isYearSelected ? localState.era.value : d.label}</span>
                      <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </GlassButton>
                    {isOpen && (
                      <div className={styles.dropdownMenu}>
                        <button
                          onClick={() => {
                            setLocalState(p => ({ ...p, era: isDecadeSelected ? { type: null, value: null } : { type: 'decade', value: d.id } }));
                            setOpenDecadeId(null);
                          }}
                          className={`${styles.dropdownItem} ${isDecadeSelected ? styles.dropdownItemActive : ''}`}
                        >
                          All {d.label}
                        </button>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        {d.years.map(yr => {
                          const isYrActive = localState.era.type === 'year' && Number(localState.era.value) === yr;
                          return (
                            <button
                              key={yr}
                              onClick={() => {
                                setLocalState(p => ({ ...p, era: isYrActive ? { type: null, value: null } : { type: 'year', value: String(yr) } }));
                                setOpenDecadeId(null);
                              }}
                              className={`${styles.dropdownItem} ${isYrActive ? styles.dropdownItemActive : ''}`}
                            >
                              {yr}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
              <Clock size={13} color="#ffffff" />
              <span className={styles.glassSectionHeader}>TIME FILTER (REVIEW DATE)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
              {TIME_OPTIONS.map(opt => (
                <GlassButton
                  key={opt.id}
                  active={localState.time === opt.id}
                  onClick={() => setLocalState({ ...localState, time: opt.id })}
                >
                  {opt.label}
                </GlassButton>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
              <Star size={13} color="#ffffff" />
              <span className={styles.glassSectionHeader}>CRITICAL ACCLAIM</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              {RATING_OPTIONS.map(opt => (
                <GlassButton
                  key={opt.id}
                  active={localState.rating === opt.id}
                  onClick={() => setLocalState({ ...localState, rating: localState.rating === opt.id ? null : opt.id })}
                >
                  {opt.label}
                </GlassButton>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
              <Flame size={13} color="#ffffff" />
              <span className={styles.glassSectionHeader}>SORTING</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
              {SORT_OPTIONS.map(opt => (
                <GlassButton
                  key={opt.id}
                  active={localState.sort === opt.id}
                  onClick={() => setLocalState({ ...localState, sort: opt.id })}
                >
                  {opt.label}
                </GlassButton>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
              <Film size={13} color="#ffffff" />
              <span className={styles.glassSectionHeader}>GENRE (MULTI-SELECT)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
              {GENRES.map((g) => (
                <GlassButton
                  key={g.id}
                  active={localState.genres.includes(g.id)}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.name}
                </GlassButton>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.glassFooter}>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasChanges}
            className={`${styles.glassClearBtn} ${hasChanges ? styles.glassClearBtnActive : styles.glassClearBtnDisabled}`}
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button type="button" onClick={handleApply} className={styles.glassApplyBtn}>
            <Filter size={15} /> Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ onSelectMovie }) {
  const { user, profile, authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingData, setLoadingData] = useState(false);
  
  const [highlightedUser, setHighlightedUser] = useState(null);
  const [selectedReviewForReplies, setSelectedReviewForReplies] = useState(null);
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterState, setFilterState] = useState({
    query: '', sort: 'newest', time: 'all', rating: null,
    era: { type: null, value: null }, genres: []
  });
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSort, setUserSort] = useState('newest');

  const [stats, setStats] = useState({ users: 0, reviews: 0, replies: 0, admins: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  const [usersList, setUsersList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  
  const [inboxTab, setInboxTab] = useState('unread');
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        if (activeTab === 'dashboard') {
          const [u, rev, rep, adm, recentU, recentR] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('reviews').select('*', { count: 'exact', head: true }),
            supabase.from('review_replies').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            supabase.from('profiles').select('id, username, avatar_url, created_at, role').order('created_at', { ascending: false }).limit(5),
            supabase.from('reviews').select('id, movie_title, tmdb_movie_id, rating, created_at, review_text, profiles(username, avatar_url)').order('created_at', { ascending: false }).limit(5)
          ]);
          setStats({ 
            users: u.count || 0, reviews: rev.count || 0,
            replies: rep.count || 0, admins: adm.count || 0
          });
          setRecentUsers(recentU.data || []);
          setRecentReviews(recentR.data || []);
        } 
        else if (activeTab === 'users') {
          const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          if (data) setUsersList(data);
        } 
        else if (activeTab === 'reviews') {
          const [revRes, repRes] = await Promise.all([
            supabase.from('reviews').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }),
            supabase.from('review_replies').select('review_id')
          ]);
          
          if (revRes.data) {
            const repliesData = repRes.data || [];
            setReviewsList(revRes.data.map(review => ({
              ...review,
              replies_count: repliesData.filter(r => String(r.review_id) === String(review.id)).length,
              likes_count: Array.isArray(review.likes) ? review.likes.length : (review.likes_count || 0)
            })));
          }
        }
        else if (activeTab === 'inbox') {
          const { data } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
          if (data) setMessagesList(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviewsList];

    if (filterState.query.trim()) {
      const q = filterState.query.toLowerCase();
      list = list.filter(r => 
        r.movie_title?.toLowerCase().includes(q) || 
        r.review_text?.toLowerCase().includes(q) ||
        r.profiles?.username?.toLowerCase().includes(q)
      );
    }

    if (filterState.time !== 'all') {
      const now = new Date();
      list = list.filter(r => {
        const rDate = new Date(r.created_at);
        if (filterState.time === 'year') return rDate.getFullYear() === now.getFullYear();
        if (filterState.time === 'month') return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
        if (filterState.time === 'week') return rDate >= new Date(now.setDate(now.getDate() - 7));
        return true;
      });
    }

    if (filterState.rating === 'highest') list = list.filter(r => r.rating >= 4);
    else if (filterState.rating === 'lowest') list = list.filter(r => r.rating > 0 && r.rating <= 2.5);

    switch (filterState.sort) {
      case 'oldest': return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'rating-high': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-low': return list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'most-likes': return list.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'most-replies': return list.sort((a, b) => (b.replies_count || 0) - (a.replies_count || 0));
      case 'most-popular': return list.sort((a, b) => ((b.likes_count || 0) + (b.replies_count || 0)) - ((a.likes_count || 0) + (a.replies_count || 0)));
      case 'least-popular': return list.sort((a, b) => ((a.likes_count || 0) + (a.replies_count || 0)) - ((b.likes_count || 0) + (b.replies_count || 0)));
      case 'newest':
      default: return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviewsList, filterState]);

  const filteredAndSortedUsers = useMemo(() => {
    let list = [...usersList];

    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      list = list.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    switch (userSort) {
      case 'oldest': return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'admins':
        return list.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      case 'regular':
        return list.sort((a, b) => {
          if (a.role !== 'admin' && b.role === 'admin') return -1;
          if (a.role === 'admin' && b.role !== 'admin') return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      case 'az': return list.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      case 'za': return list.sort((a, b) => (b.username || '').localeCompare(a.username || ''));
      case 'newest':
      default: return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [usersList, userSearchQuery, userSort]);

  const filteredMessages = useMemo(() => {
    return messagesList.filter(m => {
      const stat = m.status || 'unread';
      if (inboxTab === 'trash') return stat === 'trash';
      if (inboxTab === 'answered') return stat === 'answered';
      return stat === 'unread';
    });
  }, [messagesList, inboxTab]);

  const navigateToUser = (targetUserId) => {
    setActiveTab('users');
    setHighlightedUser(targetUserId);
    setTimeout(() => {
      const el = document.getElementById(`user-row-${targetUserId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedUser(null), 3000);
    }, 200);
  };

  const handleMovieClick = (movieTmdbId) => {
    navigate(`/admin?movie=${movieTmdbId}`);
    onSelectMovie?.(movieTmdbId);
  };

  const handleReviewClick = (movieTmdbId, reviewId) => {
    navigate(`/admin?movie=${movieTmdbId}&review=${reviewId}`);
    onSelectMovie?.(movieTmdbId);
  };

  const handleUpdateRole = async (targetUserId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUserId);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
    } else {
      alert('Failed to update user role: ' + error.message);
    }
  };

  const handleDeleteUser = async (targetUserId) => {
    if (!window.confirm("Delete this user's profile? Note: Fully removing their authentication requires a Supabase backend function.")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', targetUserId);
    if (!error) setUsersList(prev => prev.filter(u => u.id !== targetUserId));
    else alert('Failed to delete user profile: ' + error.message);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (!error) setReviewsList(prev => prev.filter(r => r.id !== reviewId));
    else alert('Failed to delete review: ' + error.message);
  };

  const handleSubmitReply = async (msgId, text) => {
    const { error } = await supabase.from('contact_messages')
      .update({ admin_reply: text, status: 'answered' })
      .eq('id', msgId);
      
    if (!error) {
      setMessagesList(prev => prev.map(m => m.id === msgId ? { ...m, admin_reply: text, status: 'answered' } : m));
      setReplyingToMessage(null);
    } else {
      alert('Failed to send reply: ' + error.message);
    }
  };

  const handleTrashMessage = async (msgId, currentStatus) => {
    if (currentStatus === 'trash') {
      if (!window.confirm("Permanently delete this message from the database?")) return;
      const { error } = await supabase.from('contact_messages').delete().eq('id', msgId);
      if (!error) setMessagesList(prev => prev.filter(m => m.id !== msgId));
      else alert('Failed to delete: ' + error.message);
    } else {
      const { error } = await supabase.from('contact_messages').update({ status: 'trash' }).eq('id', msgId);
      if (!error) setMessagesList(prev => prev.map(m => m.id === msgId ? { ...m, status: 'trash' } : m));
      else alert('Failed to trash: ' + error.message);
    }
  };

  const handleRestoreMessage = async (msgId, hasReply) => {
    const newStatus = hasReply ? 'answered' : 'unread';
    const { error } = await supabase.from('contact_messages').update({ status: newStatus }).eq('id', msgId);
    if (!error) setMessagesList(prev => prev.map(m => m.id === msgId ? { ...m, status: newStatus } : m));
    else alert('Failed to restore: ' + error.message);
  };

  if (authLoading || profile?.role !== 'admin') {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '5rem' }}>Checking permissions...</div>;
  }

  const regularUsersCount = Math.max(0, stats.users - stats.admins);
  const userPct = stats.users > 0 ? (regularUsersCount / stats.users) * 100 : 0;
  const adminPct = stats.users > 0 ? (stats.admins / stats.users) * 100 : 0;

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <ShieldAlert size={24} color="#ef4444" />
          <h2>Admin Panel</h2>
        </div>

        <nav className={styles.navMenu}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.activeNav : ''}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`${styles.navItem} ${activeTab === 'users' ? styles.activeNav : ''}`}
          >
            <Users size={18} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`${styles.navItem} ${activeTab === 'reviews' ? styles.activeNav : ''}`}
          >
            <MessageSquare size={18} /> Reviews
          </button>
          <button 
            onClick={() => setActiveTab('inbox')} 
            className={`${styles.navItem} ${activeTab === 'inbox' ? styles.activeNav : ''}`}
          >
            <Inbox size={18} /> Inbox
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => navigate('/')} className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to App
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <h1>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'users' && 'Manage Users'}
            {activeTab === 'reviews' && 'Moderate Reviews'}
            {activeTab === 'inbox' && 'Support Inbox'}
          </h1>
          <div className={styles.adminBadge}>Admin Mode</div>
        </header>

        <div className={styles.contentBody}>
          {loadingData ? (
            <div className={styles.loadingState}>Fetching live data...</div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className={styles.dashboardContainer}>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <Users size={24} className={styles.statIcon} color="#ef4444" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Users</span>
                        <span className={styles.statValue}>{stats.users}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <Star size={24} className={styles.statIcon} color="#ef4444" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Reviews</span>
                        <span className={styles.statValue}>{stats.reviews}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <MessageCircle size={24} className={styles.statIcon} color="#ef4444" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Replies</span>
                        <span className={styles.statValue}>{stats.replies}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <ShieldCheck size={24} className={styles.statIcon} color="#ef4444" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Admins</span>
                        <span className={styles.statValue}>{stats.admins}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.chartsGrid}>
                    <div className={styles.dashboardPanel}>
                      <div className={styles.panelHeader}>
                        <PieChart size={18} color="#a3a3a3" />
                        <h3>User Demographics</h3>
                      </div>
                      <div className={styles.panelContent}>
                        <div className={styles.chartLegend}>
                          <span className={styles.legendItem}><span className={styles.dotPrimary} />Regular Users ({regularUsersCount})</span>
                          <span className={styles.legendItem}><span className={styles.dotSecondary} />Admins ({stats.admins})</span>
                        </div>
                        <div className={styles.stackedBarContainer}>
                          <div className={styles.stackPrimary} style={{ width: `${userPct}%` }} />
                          <div className={styles.stackSecondary} style={{ width: `${adminPct}%` }} />
                        </div>
                        <p className={styles.chartSubtext}>Ratio of standard platform users vs staff members.</p>
                      </div>
                    </div>

                    <div className={styles.dashboardPanel}>
                      <div className={styles.panelHeader}>
                        <BarChart2 size={18} color="#a3a3a3" />
                        <h3>Activity Trend (7 Days)</h3>
                      </div>
                      <div className={styles.panelContent}>
                        <div className={styles.verticalBarChart}>
                          {MOCK_WEEK_ACTIVITY.map((data, i) => (
                            <div key={i} className={styles.vBarContainer}>
                              <div className={styles.vBarWrapper}>
                                <div className={styles.vBarFill} style={{ height: `${data.value}%` }} />
                              </div>
                              <span className={styles.vBarLabel}>{data.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dashboardGrid}>
                    <div className={styles.dashboardPanel}>
                      <div className={styles.panelHeader}>
                        <Activity size={18} color="#a3a3a3" />
                        <h3>Recent Reviews</h3>
                      </div>
                      <div className={styles.panelContent}>
                        {recentReviews.length === 0 ? (
                          <div className={styles.emptyState}>No recent reviews.</div>
                        ) : (
                          recentReviews.map(review => (
                            <div key={review.id} className={styles.activityItem}>
                              <div className={styles.activityAvatar}>
                                {review.profiles?.avatar_url ? (
                                  <img src={review.profiles.avatar_url} alt="avatar" />
                                ) : (
                                  <UserIcon size={14} color="#a3a3a3" />
                                )}
                              </div>
                              <div className={styles.activityDetails}>
                                <div className={styles.activityTitle}>
                                  <strong>{review.profiles?.username || 'Unknown'}</strong> reviewed{' '}
                                  <button onClick={() => handleMovieClick(review.tmdb_movie_id)} className={styles.inlineLink}>
                                    {review.movie_title || 'Unknown'}
                                  </button>
                                </div>
                                <div className={styles.activityMeta}>
                                  <StarRating rating={review.rating || 0} interactive={false} size={11} />
                                  <span>•</span>
                                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className={styles.activityExcerpt}>{review.review_text}</p>
                              </div>
                            </div>
                          ))
                        )}
                        <button onClick={() => setActiveTab('reviews')} className={styles.viewAllBtn}>
                          View All Reviews
                        </button>
                      </div>
                    </div>

                    <div className={styles.dashboardPanel}>
                      <div className={styles.panelHeader}>
                        <Sparkles size={18} color="#a3a3a3" />
                        <h3>Newest Users</h3>
                      </div>
                      <div className={styles.panelContent}>
                        {recentUsers.length === 0 ? (
                          <div className={styles.emptyState}>No recent users.</div>
                        ) : (
                          recentUsers.map(u => (
                            <div key={u.id} className={styles.activityItem}>
                              <div className={styles.activityAvatar}>
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="avatar" />
                                ) : (
                                  <UserIcon size={14} color="#a3a3a3" />
                                )}
                              </div>
                              <div className={styles.activityDetails}>
                                <div className={styles.activityTitle}>
                                  <button onClick={() => navigateToUser(u.id)} className={styles.inlineLink}>
                                    <strong>{u.username || 'Anonymous'}</strong>
                                  </button>
                                  {u.role === 'admin' && <span className={styles.miniBadge}>Admin</span>}
                                </div>
                                <div className={styles.activityMeta}>
                                  Joined {new Date(u.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <button onClick={() => setActiveTab('users')} className={styles.viewAllBtn}>
                          Manage Users
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className={styles.tabContainer}>
                  <div className={styles.usersToolbar}>
                    <div className={styles.userSearchBox}>
                      <Search size={16} className={styles.userSearchIcon} />
                      <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className={styles.userSearchInput}
                      />
                      {userSearchQuery && (
                        <button 
                          type="button" 
                          onClick={() => setUserSearchQuery('')} 
                          className={styles.clearSearchBtn}
                          aria-label="Clear Search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className={styles.userSortGroup}>
                      <span className={styles.sortLabel}>Sort:</span>
                      <div className={styles.sortPills}>
                        {[
                          { id: 'newest', label: 'Newest' },
                          { id: 'oldest', label: 'Oldest' },
                          { id: 'admins', label: 'Admins First' },
                          { id: 'regular', label: 'Users First' },
                          { id: 'az', label: 'A-Z' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setUserSort(opt.id)}
                            className={`${styles.userSortPill} ${userSort === opt.id ? styles.userSortPillActive : ''}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Password</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedUsers.map((u) => (
                          <tr 
                            key={u.id} 
                            id={`user-row-${u.id}`}
                            className={highlightedUser === u.id ? styles.highlightedRow : ''}
                          >
                            <td>
                              <div className={styles.userCell}>
                                <div className={styles.tableAvatar}>
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="avatar" />
                                  ) : (
                                    <UserIcon size={14} color="#a3a3a3" />
                                  )}
                                </div>
                                <button 
                                  onClick={() => navigate(`/user/${u.username}`)} 
                                  className={styles.clickableLink}
                                  title="View User Profile"
                                >
                                  {u.username || 'Anonymous'}
                                </button>
                              </div>
                            </td>
                            <td className={styles.truncateCell}>{u.email || 'Private / Not Synced'}</td>
                            <td className={styles.mutedCell}>•••••••• (Encrypted)</td>
                            <td>
                              <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
                                {u.role || 'user'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actionGroup}>
                                {u.id !== user.id && (
                                  <>
                                    <button 
                                      onClick={() => handleUpdateRole(u.id, u.role)}
                                      className={styles.actionBtn}
                                      title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                    >
                                      {u.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)}
                                      className={styles.dangerBtn}
                                      title="Delete User"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredAndSortedUsers.length === 0 && (
                          <tr><td colSpan="5" className={styles.emptyState}>No users match your criteria.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className={styles.tabContainer}>
                  <div className={styles.tabToolbar}>
                    <span className={styles.toolbarLabel}>Found {filteredAndSortedReviews.length} matching reviews</span>
                    <button 
                      onClick={() => setIsFilterModalOpen(true)}
                      className={styles.filterTriggerBtn}
                    >
                      <Filter size={16} /> Filter & Sort
                    </button>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Reviewer</th>
                          <th>Rating</th>
                          <th>Text</th>
                          <th>Stats</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedReviews.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <div className={styles.movieCell}>
                                {r.movie_poster_path ? (
                                  <img src={getImageUrl(r.movie_poster_path, 'w92')} alt="poster" className={styles.movieCellImg} />
                                ) : (
                                  <div className={styles.movieCellPlaceholder} />
                                )}
                                <button 
                                  onClick={() => handleMovieClick(r.tmdb_movie_id)} 
                                  className={styles.clickableLink}
                                  title="View Movie Modal"
                                >
                                  {r.movie_title || 'Unknown'}
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className={styles.userCell}>
                                <div className={styles.tableAvatar}>
                                  {r.profiles?.avatar_url ? (
                                    <img src={r.profiles.avatar_url} alt="avatar" />
                                  ) : (
                                    <UserIcon size={14} color="#a3a3a3" />
                                  )}
                                </div>
                                <button 
                                  onClick={() => navigateToUser(r.user_id)} 
                                  className={styles.clickableLink}
                                  title="Go to User"
                                >
                                  {r.profiles?.username || 'Unknown'}
                                </button>
                              </div>
                            </td>
                            <td>
                              <div style={{ pointerEvents: 'none' }}>
                                <StarRating rating={r.rating || 0} interactive={false} size={14} />
                              </div>
                            </td>
                            <td>
                              <button 
                                onClick={() => handleReviewClick(r.tmdb_movie_id, r.id)} 
                                className={styles.textLinkBtn}
                                title="View in Movie Modal"
                              >
                                {r.review_text}
                              </button>
                            </td>
                            <td>
                              <div className={styles.statsRowCell}>
                                <span className={styles.statPill} title="Likes">
                                  <Heart size={14} fill="#ef4444" color="#ef4444" /> {r.likes_count || 0}
                                </span>
                                <button 
                                  onClick={() => setSelectedReviewForReplies(r)} 
                                  className={`${styles.statPill} ${styles.clickableStatPill}`} 
                                  title="View Replies"
                                >
                                  <MessageSquare size={14} color="#a3a3a3" /> {r.replies_count || 0}
                                </button>
                              </div>
                            </td>
                            <td>
                              <button onClick={() => handleDeleteReview(r.id)} className={styles.dangerBtn} title="Delete Review">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredAndSortedReviews.length === 0 && <tr><td colSpan="6" className={styles.emptyState}>No reviews found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'inbox' && (
                <div className={styles.tabContainer}>
                  <div className={styles.usersToolbar}>
                    <div className={styles.userSortGroup}>
                      <span className={styles.sortLabel}>Folders:</span>
                      <div className={styles.sortPills}>
                        {['unread', 'answered', 'trash'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setInboxTab(tab)}
                            className={`${styles.userSortPill} ${inboxTab === tab ? styles.userSortPillActive : ''}`}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Sender Details</th>
                          <th>Message Content</th>
                          <th>Status / Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMessages.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className={styles.senderCell}>
                                <span className={styles.senderName}>{m.name || 'Anonymous'}</span>
                                <span className={styles.senderEmail}><Mail size={12}/> {m.email || 'No email provided'}</span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.msgCell}>
                                <span className={styles.msgSubject}>{m.subject || 'No Subject'}</span>
                                <p className={styles.msgBody}>{m.message}</p>
                                {m.status === 'answered' && m.admin_reply && (
                                  <div className={styles.msgReplyBlock}>
                                    <strong>Admin Reply:</strong> {m.admin_reply}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.statusCell}>
                                <span className={`${styles.roleBadge} ${m.status === 'answered' ? styles.roleAdmin : styles.roleUser}`}>
                                  {m.status || 'unread'}
                                </span>
                                <span className={styles.msgDate}>{new Date(m.created_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionGroup}>
                                {inboxTab === 'trash' ? (
                                  <button onClick={() => handleRestoreMessage(m.id, !!m.admin_reply)} className={styles.actionBtn} title="Restore Message">
                                    <CornerUpLeft size={16} />
                                  </button>
                                ) : (
                                  <button onClick={() => setReplyingToMessage(m)} className={styles.actionBtn} title="Reply to Message">
                                    <Send size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleTrashMessage(m.id, m.status)} className={styles.dangerBtn} title={inboxTab === 'trash' ? "Delete Permanently" : "Move to Trash"}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredMessages.length === 0 && (
                          <tr><td colSpan="4" className={styles.emptyState}>No messages in this folder.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedReviewForReplies && (
        <AdminRepliesModal 
          review={selectedReviewForReplies} 
          onClose={() => setSelectedReviewForReplies(null)} 
        />
      )}

      {isFilterModalOpen && (
        <AdminReviewFilterModal 
          onClose={() => setIsFilterModalOpen(false)}
          filterState={filterState}
          onApplyFilters={setFilterState}
        />
      )}
      
      {replyingToMessage && (
        <AdminReplyMessageModal
          message={replyingToMessage}
          onClose={() => setReplyingToMessage(null)}
          onSubmit={handleSubmitReply}
        />
      )}
    </div>
  );
}