'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { initUserProfile } from '../../lib/studyData';
import { useAuth } from '../../lib/AuthContext';
import PrivacyPolicyModal from '../../lib/PrivacyPolicyModal';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (!loading && user && !showPrivacy) router.replace('/home');
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(mode === 'login' ? 'Wrong email or password.' : 'Password needs at least 8 characters');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await initUserProfile(result.user.uid, { email: result.user.email, isPasswordAccount: true });
        setShowPrivacy(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace('/home');
      }
    } catch (e) {
      setError(mode === 'login' ? 'Wrong email or password.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h1>Studivo</h1>
        <p>Track your study time, take timed MCQ tests, and see exactly where you lose marks.</p>
      </div>
      <div className="auth-side">
        <div className="auth-card">
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <form onSubmit={handleSubmit}>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
            <label className="label">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            {!!error && <div className="error-text">{error}</div>}
            <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', padding: 15 }}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
            <a href="#" className="link-green" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </a>
          </p>
        </div>
      </div>
      <PrivacyPolicyModal visible={showPrivacy} onConfirm={() => { setShowPrivacy(false); router.replace('/home'); }} />
    </div>
  );
}
