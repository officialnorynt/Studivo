'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import Nav from '../../lib/Nav';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { getUserStats, formatDuration } from '../../lib/studyData';
import PrivacyPolicyModal from '../../lib/PrivacyPolicyModal';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => { if (user) getUserStats(user.uid).then(setStats); }, [user]);

  if (!user) return null;

  const handleDelete = async () => {
    if (!confirm('This permanently deletes your Studivo account and study data. This cannot be undone. Continue?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private', 'profile'));
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(auth.currentUser);
      router.replace('/login');
    } catch (e) {
      alert('Could not delete account: ' + e.message + '\n\nYou may need to log in again first, then retry.');
    }
  };

  const name = stats?.displayName || user.email?.split('@')[0] || 'Studivo user';

  return (
    <div>
      <Nav />
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, marginTop: 8 }}>
          {stats?.photoURL ? (
            <img src={stats.photoURL} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 28, background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ marginLeft: 14 }}>
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontWeight: 800 }}>{stats?.currentStreak || 0}</div><div style={{ fontSize: 11, color: '#888' }}>Day Streak</div></div>
          <div><div style={{ fontWeight: 800 }}>{formatDuration(stats?.totalStudySeconds || 0)}</div><div style={{ fontSize: 11, color: '#888' }}>Total Study</div></div>
          <div><div style={{ fontWeight: 800 }}>{stats?.longestStreak || 0}</div><div style={{ fontSize: 11, color: '#888' }}>Longest Streak</div></div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {[
            { label: 'Edit Profile', onClick: () => router.push('/profile/edit') },
            { label: 'History', onClick: () => router.push('/history') },
            { label: 'Privacy', onClick: () => setShowPrivacy(true) },
            { label: 'Delete Account', danger: true, onClick: handleDelete },
            { label: 'Sign Out', danger: true, onClick: () => { signOut(auth); router.replace('/login'); } },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              onClick={item.onClick}
              style={{
                padding: '14px 16px', cursor: 'pointer', fontSize: 15,
                borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                color: item.danger ? '#ef4444' : '#1a1a1a',
              }}
            >{item.label}</div>
          ))}
        </div>

        <PrivacyPolicyModal visible={showPrivacy} onConfirm={() => setShowPrivacy(false)} readOnly />
      </div>
    </div>
  );
}
