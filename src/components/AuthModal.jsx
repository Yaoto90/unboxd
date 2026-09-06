import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setErrorMsg('');
      setEmail('');
      setPassword('');
      setUsername('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const cleanUsername = username.trim();

        if (cleanUsername.length < 3) {
          throw new Error('Username must be at least 3 characters.');
        }

        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          throw new Error('This username is already taken. Please choose another.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { user_name: cleanUsername }
          }
        });
        if (error) throw error;
        alert('Account created! Check your email if confirmation is required.');
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0c',
          border: '1px solid #1f1f23',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          padding: '3rem',
          color: '#ffffff',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.95)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <span style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#71717a',
              marginBottom: '0.4rem'
            }}>
              UnBoxd Account
            </span>
            <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#141417',
              border: '1px solid #232328',
              color: '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#3f3f46';
              e.currentTarget.style.background = '#1a1a1e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.borderColor = '#232328';
              e.currentTarget.style.background = '#141417';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.75rem'
          }}>
            <p style={{ margin: 0, color: '#f87171', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {errorMsg}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isSignUp && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#71717a',
                marginBottom: '8px'
              }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#141417',
                  border: '1px solid #232328',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#52525b')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#232328')}
              />
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#71717a',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                background: '#141417',
                border: '1px solid #232328',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#52525b')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#232328')}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#71717a',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                background: '#141417',
                border: '1px solid #232328',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#52525b')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#232328')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '14px 20px',
              background: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '10px',
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.15s ease, opacity 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#ffffff';
            }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', marginBottom: 0, fontSize: '0.9rem', textAlign: 'center', color: '#71717a' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}