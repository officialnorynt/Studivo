'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../lib/Nav';
import { useAuth } from '../../lib/AuthContext';
import { startSession, endSession, getUserStats, formatDuration, todayKeyExport } from '../../lib/studyData';

const R = 100;
const C = 2 * Math.PI * R;

export default function StudyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [todayTotal, setTodayTotal] = useState(0);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const sessionIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    getUserStats(user.uid).then((s) => setTodayTotal((s?.dailyTotals || {})[todayKeyExport()] || 0));
    return () => clearInterval(intervalRef.current);
  }, [user]);

  if (!user) return null;

  const handleStart = async () => {
    const id = await startSession(user.uid);
    sessionIdRef.current = id;
    startedAtRef.current = Date.now();
    setActive(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  };

  const handleStop = async () => {
    clearInterval(intervalRef.current);
    setActive(false);
    if (sessionIdRef.current) {
      const seconds = await endSession(user.uid, sessionIdRef.current);
      setTodayTotal((t) => t + seconds);
    }
    sessionIdRef.current = null;
    setElapsed(0);
  };

  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  const progress = Math.min(1, elapsed / 3600);

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Study</h1>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="muted-sm">Today's total</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{formatDuration(todayTotal)}</div>
          </div>
          <div className="streak-chip">{active ? '● Studying' : 'Ready'}</div>
        </div>

        <div className="ring-wrap">
          <svg width="240" height="240" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r={R} fill="none" stroke="#e5e7eb" strokeWidth="14" />
            <circle cx="120" cy="120" r={R} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="ring-center">
            <div className="muted-sm">{active ? 'Session time' : 'Ready to focus'}</div>
            <div className="ring-time">{h}:{m}:{s}</div>
          </div>
        </div>

        {active ? (
          <button className="btn-danger" style={{ width: '100%', marginBottom: 12, padding: 16 }} onClick={handleStop}>Stop session</button>
        ) : (
          <button className="btn-primary" style={{ width: '100%', marginBottom: 12, padding: 16 }} onClick={handleStart}>Start studying</button>
        )}
        <button className="btn-outline" style={{ width: '100%', padding: 15 }} onClick={() => router.push('/exam/build')}>Take an exam</button>
      </div>
    </div>
  );
}
