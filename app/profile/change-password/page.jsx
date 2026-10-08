'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Nav from '../../../lib/Nav';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../lib/AuthContext';

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  if (!user) return null;

  const handleChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('New password needs at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError("New passwords don't match"); return; }
    setError('');
    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', user.uid), { passwordChangedAt: serverTimestamp() });
      alert('Password changed.');
      router.push('/profile/edit');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Change Password</h1>
        <form onSubmit={handleChange} className="card">
          <label className="label">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <label className="label">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <label className="label">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {!!error && <div className="error-text">{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Please wait…' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
}
