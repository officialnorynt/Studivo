'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Nav from '../../lib/Nav';
import { useAuth } from '../../lib/AuthContext';
import { getSessionHistory, formatDuration } from '../../lib/studyData';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [attempts, setAttempts] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [tab, setTab] = useState('exams');

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'examAttempts'), orderBy('createdAt', 'desc'));
    getDocs(q).then((snap) => setAttempts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    getSessionHistory(user.uid, 50).then(setSessions);
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>History</h1>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          <button
            onClick={() => setTab('exams')}
            style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, borderRadius: 9, background: tab === 'exams' ? '#22c55e' : 'transparent', color: tab === 'exams' ? '#fff' : '#666' }}
          >Exam Results</button>
          <button
            onClick={() => setTab('study')}
            style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, borderRadius: 9, background: tab === 'study' ? '#22c55e' : 'transparent', color: tab === 'study' ? '#fff' : '#666' }}
          >Study Sessions</button>
        </div>

        {tab === 'exams' && (
          <>
            {attempts === null && <p>Loading…</p>}
            {attempts?.length === 0 && <p className="muted-sm">No test attempts yet.</p>}
            {attempts?.map((a) => {
              const date = a.createdAt?.toDate ? a.createdAt.toDate() : null;
              const open = openId === a.id;
              const wrongOrSkipped = (a.detail || []).filter((d) => d.outcome !== 'correct');
              return (
                <div className="card" key={a.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpenId(open ? null : a.id)}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{a.scored} / {a.maxMarks} marks</div>
                      <div className="muted-sm">{date ? date.toLocaleString() : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>
                      <div>{a.accuracy}% accuracy</div>
                      <div>{a.correct} correct · {a.incorrect} wrong · {a.skipped} skipped</div>
                    </div>
                  </div>
                  {open && (
                    <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 14 }}>
                      {wrongOrSkipped.length === 0 && <p className="muted-sm">Everything correct on this attempt.</p>}
                      {wrongOrSkipped.map((d, i) => (
                        <div key={i} style={{ marginBottom: 14 }}>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{d.text}</p>
                          {d.choices.filter((c) => c.trim()).map((c, ci) => {
                            const isCorrect = ci === d.correctIndex;
                            const isGiven = ci === d.given;
                            return (
                              <p key={ci} style={{
                                margin: '4px 0', fontSize: 13,
                                color: isCorrect ? '#166534' : (isGiven ? '#b91c1c' : '#444'),
                                fontWeight: isCorrect || isGiven ? 700 : 400,
                              }}>
                                {LETTERS[ci] || ci + 1}. {c}{isCorrect ? ' — correct answer' : ''}{isGiven && !isCorrect ? ' — your answer' : ''}
                              </p>
                            );
                          })}
                          {d.outcome === 'skipped' && <p style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>Skipped</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'study' && (
          <>
            {sessions === null && <p>Loading…</p>}
            {sessions?.length === 0 && <p className="muted-sm">No study sessions logged yet.</p>}
            {sessions?.map((s) => (
              <div className="row" key={s.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.start?.toLocaleDateString()}</div>
                  <div className="muted-sm">{s.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {s.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="time">{formatDuration(s.seconds)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
