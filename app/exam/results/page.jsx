'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Nav from '../../../lib/Nav';
import { useAuth } from '../../../lib/AuthContext';
import { useExam } from '../../../lib/ExamContext';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { computeResults, resetExam } = useExam();
  const results = useMemo(() => computeResults(), []);
  const [showReview, setShowReview] = useState(true);
  const [saveState, setSaveState] = useState('saving');
  const savedRef = useRef(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!user || savedRef.current) return;
    savedRef.current = true;
    addDoc(collection(db, 'users', user.uid, 'examAttempts'), {
      createdAt: serverTimestamp(),
      total: results.total,
      correct: results.correct,
      incorrect: results.incorrect,
      skipped: results.skipped,
      deducted: results.deducted,
      scored: results.scored,
      maxMarks: results.maxMarks,
      accuracy: results.accuracy,
      detail: results.detail,
    }).then(() => setSaveState('saved')).catch(() => setSaveState('error'));
  }, [user]);

  if (!user) return null;

  const wrongOrSkipped = results.detail.filter((d) => d.outcome !== 'correct');

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Results</h1>
        <div className="card" style={{ background: '#111', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{results.scored} / {results.maxMarks}</div>
          <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>Total Marks</div>
        </div>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontWeight: 800, fontSize: 18 }}>{results.accuracy}%</div><div style={{ fontSize: 11, color: '#888' }}>Accuracy</div></div>
          <div><div style={{ fontWeight: 800, fontSize: 18 }}>{results.correct}</div><div style={{ fontSize: 11, color: '#888' }}>Correct</div></div>
          <div><div style={{ fontWeight: 800, fontSize: 18, color: '#ef4444' }}>{results.incorrect}</div><div style={{ fontSize: 11, color: '#888' }}>Incorrect</div></div>
          <div><div style={{ fontWeight: 800, fontSize: 18, color: '#888' }}>{results.skipped}</div><div style={{ fontSize: 11, color: '#888' }}>Skipped</div></div>
        </div>
        {results.deducted > 0 && (
          <div className="card" style={{ background: '#fef2f2', color: '#b91c1c', textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
            -{results.deducted} marks deducted for incorrect answers
          </div>
        )}
        <p style={{ fontSize: 12, color: saveState === 'error' ? '#c00' : '#888' }}>
          {saveState === 'saving' && 'Saving result…'}
          {saveState === 'saved' && 'Saved to your history.'}
          {saveState === 'error' && "Couldn't save this result — check your connection and Firestore rules."}
        </p>
        <button className="btn-outline" onClick={() => setShowReview((v) => !v)} style={{ width: '100%', marginBottom: 12 }}>
          {showReview ? 'Hide' : 'See'} Wrong/Skipped Questions
        </button>
        {showReview && wrongOrSkipped.map((d, i) => (
          <div className="card" key={i}>
            <p style={{ fontWeight: 600 }}>{d.text}</p>
            {d.choices.filter((c) => c.trim()).map((c, ci) => {
              const isCorrect = ci === d.correctIndex;
              const isGiven = ci === d.given;
              return (
                <p key={ci} style={{
                  margin: '4px 0', fontSize: 14,
                  color: isCorrect ? '#166534' : (isGiven ? '#b91c1c' : '#444'),
                  fontWeight: isCorrect || isGiven ? 700 : 400,
                }}>
                  {LETTERS[ci] || ci + 1}. {c}{isCorrect ? ' — correct answer' : ''}{isGiven && !isCorrect ? ' — your answer' : ''}
                </p>
              );
            })}
            {d.outcome === 'skipped' && <p style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Skipped</p>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => { resetExam(); router.push('/exam/build'); }}>New Test</button>
          <button className="btn-outline" style={{ flex: 1 }} onClick={() => router.push('/history')}>View History</button>
        </div>
      </div>
    </div>
  );
}
