'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../lib/Nav';
import { useAuth } from '../../lib/AuthContext';
import { getUserStats, getLeaderboard, formatDuration, todayKeyExport, weekDayKeys } from '../../lib/studyData';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    getUserStats(user.uid).then(setStats);
    getLeaderboard('daily', 5).then(setLeaderboard);
  }, [user]);

  if (!user) return null;

  const daily = stats?.dailyTotals || {};
  const keys = weekDayKeys();
  const today = daily[todayKeyExport()] || 0;
  const week = keys.reduce((sum, k) => sum + (daily[k] || 0), 0);
  const total = stats?.totalStudySeconds || 0;
  const maxDay = Math.max(1, ...keys.map((k) => daily[k] || 0));
  const name = stats?.displayName || user.email?.split('@')[0] || 'there';

  return (
    <div>
      <Nav />
      <div className="container wide">
        <div className="greet">
          <div>
            <div className="muted-sm">{greeting()}</div>
            <h1>{name} 👋</h1>
          </div>
          <div className="streak-chip">🔥 {stats?.currentStreak || 0} day streak</div>
        </div>

        <div className="grid-2">
          <div>
            <div className="hero">
              <div className="sm">Today's study</div>
              <div className="big">{formatDuration(today)}</div>
              <button className="btn-white" style={{ width: '100%', padding: 15 }} onClick={() => router.push('/study')}>Start Studying</button>
              <div className="tiles">
                <div className="tile"><div className="v">{formatDuration(today)}</div><div className="k">Today</div></div>
                <div className="tile"><div className="v">{formatDuration(week)}</div><div className="k">This week</div></div>
                <div className="tile"><div className="v">{formatDuration(total)}</div><div className="k">Total</div></div>
              </div>
            </div>

            <div className="card">
              <h3>Your progress</h3>
              <div className="chart">
                {keys.map((k, i) => {
                  const val = daily[k] || 0;
                  const h = Math.max(6, (val / maxDay) * 100);
                  const label = new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })[0];
                  return (
                    <div key={k} className="bar-col">
                      <div className={'bar' + (i === keys.length - 1 ? ' today' : '')} style={{ height: h + '%' }} />
                      <div className="bar-label">{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Leaderboard today</h3>
              <a href="#" className="link-green" onClick={(e) => { e.preventDefault(); router.push('/rank'); }}>View all</a>
            </div>
            {leaderboard.length === 0 && <p className="muted-sm">No study time logged yet today.</p>}
            {leaderboard.map((row, i) => (
              <div key={row.uid} className={'row' + (row.uid === user.uid ? ' me' : '')}>
                <div className="rank">#{i + 1}</div>
                <div className="avatar">{(row.name || '?')[0].toUpperCase()}</div>
                <div className="name">{row.uid === user.uid ? 'You' : row.name}</div>
                <div className="time">{formatDuration(row.seconds)}</div>
              </div>
            ))}
            <button className="btn-outline" style={{ width: '100%', marginTop: 14 }} onClick={() => router.push('/exam/build')}>Take a practice test</button>
          </div>
        </div>
      </div>
    </div>
  );
}
