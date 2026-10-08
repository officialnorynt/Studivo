'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Nav from '../../../lib/Nav';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../lib/AuthContext';
import { IMGBB_API_KEY } from '../../../lib/imgbbConfig';

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState(null);
  const hasPasswordProvider = user?.providerData?.some((p) => p.providerId === 'password');

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || null);
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      const data = snap.data();
      if (data?.photoURL) setPhotoURL(data.photoURL);
      if (data?.passwordChangedAt) setPasswordChangedAt(data.passwordChangedAt.toDate());
    });
  }, [user]);

  if (!user) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
      const json = await response.json();
      if (!json.success) throw new Error(json.error?.message || 'Upload failed');
      const url = json.data.url;
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoURL(url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName });
      await updateProfile(auth.currentUser, { displayName });
      alert('Name saved.');
    } catch (err) {
      alert('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Edit Profile</h1>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {photoURL ? (
            <img src={photoURL} alt="" style={{ width: 88, height: 88, borderRadius: 44, objectFit: 'cover', marginBottom: 8 }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: 44, background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 8px' }}>
              {(displayName || user.email || '?')[0]?.toUpperCase()}
            </div>
          )}
          <label style={{ color: '#377ADD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : 'Change Photo'}
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>

        <label className="label">Name</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        <button className="btn-primary" onClick={handleSaveName} disabled={saving} style={{ marginBottom: 20 }}>
          {saving ? 'Saving…' : 'Save Name'}
        </button>

        <label className="label">Email</label>
        <p>{user.email}</p>

        {hasPasswordProvider && (
          <>
            <label className="label">Password</label>
            <p>{passwordChangedAt ? `Last changed ${passwordChangedAt.toLocaleDateString()}` : 'Not changed yet'}</p>
            <button className="btn-outline" onClick={() => router.push('/profile/change-password')}>Change Password</button>
          </>
        )}
      </div>
    </div>
  );
}
