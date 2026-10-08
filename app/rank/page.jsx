'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../lib/Nav';
import { useAuth } from '../../lib/AuthContext';
import { getLeaderboard, formatDuration } from '../../lib/studyData';

const RANGES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'alltime', label: 'All Time' },
];

export default function RankPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState('daily');
  const [rows, setRows] = useState([]);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => { getLeaderboard(range, 50).then(setRows); }, [range]);

  if (!user) return null;

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Leaderboard</h1>
        <div style={{ display: 'flex', background: '#f2f2f2', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, borderRadius: 8,
                background: range === r.key ? '#22c55e' : 'transparent',
                color: range === r.key ? '#fff' : '#666',
              }}
            >{r.label}</button>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={row.uid} style={{
            display: 'flex', alignItems: 'center', padding: '10px 8px', fontSize: 14,
            borderBottom: '1px solid #f0f0f0',
            background: row.uid === user.uid ? '#f0fdf4' : 'transparent', borderRadius: 8,
          }}>
            <div style={{ width: 36, fontWeight: 700 }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</div>
            <div style={{ flex: 1 }}>{row.uid === user.uid ? 'You' : row.name}</div>
            <div style={{ color: '#666' }}>{formatDuration(row.seconds)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
