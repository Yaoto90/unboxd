import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const cleanUsername = username.trim();

        // Check if username is already claimed
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();

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
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#1a1d20', color: '#fff', padding: '2rem',
        borderRadius: '8px', width: '320px', position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ marginTop: 0 }}>{isSignUp ? 'Join UnBoxd' : 'Sign In'}</h2>
        
        {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '0.85rem' }}>{errorMsg}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#0a0a0a', color: '#fff' }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#0a0a0a', color: '#fff' }}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#0a0a0a', color: '#fff' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px', background: '#00e054', border: 'none',
              borderRadius: '4px', color: '#000', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            style={{ color: '#00e054', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  );
}