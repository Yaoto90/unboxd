import { useState } from 'react';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import styles from './CSS/ContactUs.module.css';

const INITIAL_FORM = { name: '', email: '', subject: '', message: '' };

export default function ContactUs() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('submitting');
    setErrorMsg('');

    const { error } = await supabase.from('contact_messages').insert({
      user_id: user?.id || null,
      ...formData
    });

    if (error) {
      setErrorMsg('Failed to send message. Please try again.');
      setStatus('error');
    } else {
      setStatus('success');
      setFormData(INITIAL_FORM);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.headerInfo}>
        <h1 className={styles.title}>Get in Touch</h1>
        <p className={styles.subtitle}>
          Have a question, feedback, or need support? Fill out the form below and our team will get back to you shortly.
        </p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.contactForm}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={styles.glassInput}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={styles.glassInput}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="subject">Subject</label>
            <div className={styles.inputIconWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                className={`${styles.glassInput} ${styles.hasIcon}`}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="message">Message</label>
            <div className={styles.inputIconWrapper}>
              <MessageSquare size={16} className={styles.textareaIcon} />
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                rows={5}
                className={`${styles.glassInput} ${styles.glassTextarea}`}
                required
              />
            </div>
          </div>

          {status === 'error' && <p className={styles.errorMsg}>{errorMsg}</p>}

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={status === 'submitting' || status === 'success'}
          >
            {status === 'submitting' ? 'Sending...' : status === 'success' ? 'Message Sent!' : (
              <>
                <Send size={16} /> Send Message
              </>
            )}
          </button>

          {status === 'success' && (
            <p className={styles.successMsg}>Thank you for reaching out! We&apos;ll reply soon.</p>
          )}
        </form>
      </div>
    </div>
  );
}