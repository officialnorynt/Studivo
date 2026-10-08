'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { useExam } from '../../../lib/ExamContext';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function TakePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { examQuestions, settings, answers, setAnswer, skipQuestion, examStartedAt } = useExam();
  const totalSeconds = settings.totalTimeMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const endedRef = useRef(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => {
    if (!examStartedAt) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartedAt) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(id);
        router.replace('/exam/results');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [examStartedAt]);

  if (!user) return null;

  const handleEnd = () => {
    if (!confirm('End exam? Unanswered questions will count as skipped.')) return;
    endedRef.current = true;
    router.replace('/exam/results');
  };

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');

  return (
    <div>
      <div style={{ background: '#111', color: '#fff', textAlign: 'center', padding: 14, fontWeight: 800, fontSize: 18, position: 'sticky', top: 0, zIndex: 10 }}>
        {m}:{s}
      </div>
      <div className="container">
        {examQuestions.map((q, qi) => {
          const given = answers[q.id];
          return (
            <div className="card" key={q.id}>
              <p style={{ fontWeight: 600 }}>{qi + 1}. {q.text}</p>
              {q.choices.filter((c) => c.trim()).map((c, ci) => (
                <button
                  key={ci}
                  onClick={() => setAnswer(q.id, ci)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
                    background: given === ci ? '#dcfce7' : '#fff',
                    border: '1px solid ' + (given === ci ? '#22c55e' : '#ddd'),
                    color: given === ci ? '#166534' : '#333', fontWeight: given === ci ? 600 : 400,
                  }}
                >
                  {LETTERS[ci] || ci + 1}. {c}
                </button>
              ))}
              {settings.allowSkip && (
                <button className="btn-outline" onClick={() => skipQuestion(q.id)} style={{ fontSize: 12, padding: '6px 12px', color: given === 'skipped' ? '#ef4444' : '#666' }}>
                  {given === 'skipped' ? 'Skipped' : 'Skip this question'}
                </button>
              )}
            </div>
          );
        })}
        <button className="btn-danger" onClick={handleEnd} style={{ width: '100%' }}>End Exam</button>
      </div>
    </div>
  );
}
