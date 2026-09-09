import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';
import styles from './CSS/AuthModal.module.css';

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
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modal}>
        <div className={styles.header}>
          <div>
            <span className={styles.subTitle}>UnBoxd Account</span>
            <h2 className={styles.title}>
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
          </div>

          <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner}>
            <p className={styles.errorText}>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <div>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className={styles.switchBtn}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}