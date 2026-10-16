'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../../lib/Nav';
import { useAuth } from '../../../lib/AuthContext';
import { useExam } from '../../../lib/ExamContext';
import { extractTextFromFiles } from '../../../lib/ocr';
import { parseQuestionsFromText } from '../../../lib/examParser';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function BuildPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    settings, updateSettings,
    questions, addQuestion, removeQuestion, updateQuestionText, updateChoice, addChoice, setCorrectChoice, appendParsedQuestions,
    examQuestions, setExamSize, randomizeSelection,
    startExam,
  } = useExam();
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [sizeInput, setSizeInput] = useState(String(questions.length));

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading]);
  useEffect(() => { setSizeInput(String(questions.length)); }, [questions.length]);

  if (!user) return null;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setScanning(true);
    setScanStatus('Starting…');
    try {
      const text = await extractTextFromFiles(files, (info) => {
        setScanStatus(`${info.status}${info.pct ? ` — ${info.pct}%` : ''}`);
      });
      const parsed = parseQuestionsFromText(text);
      if (parsed.length === 0) {
        alert('No questions could be detected in those files. Try clearer photos, or add questions manually below.');
      } else {
        appendParsedQuestions(parsed);
        alert(`Found ${parsed.length} question${parsed.length === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}. Check each one below — fill in anything missing or wrong.`);
      }
    } catch (err) {
      alert('Scan failed: ' + err.message);
    } finally {
      setScanning(false);
      setScanStatus('');
      e.target.value = '';
    }
  };

  const commitSize = () => {
    const n = parseInt(sizeInput, 10) || questions.length;
    setExamSize(n);
    setSizeInput(String(Math.max(1, Math.min(questions.length, n))));
  };
  const handleRandomize = () => {
    const n = parseInt(sizeInput, 10) || questions.length;
    randomizeSelection(n);
  };

  const handleStart = () => {
    const bad = questions.find((q) => !q.text.trim() || q.choices.filter((c) => c.trim()).length < 2 || q.correctIndex === null);
    if (bad) {
      alert('Every question needs question text, at least 2 choices, and a marked correct answer.');
      return;
    }
    startExam();
    router.push('/exam/take');
  };

  const poolSize = questions.length;
  const usingSubset = examQuestions.length < poolSize;

  return (
    <div>
      <Nav />
      <div className="container">
        <h1>Build a Test</h1>

        <div className="card">
          <h3>Settings</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label className="label">Marks / Question</label>
              <input type="number" value={settings.marksPerQuestion} onChange={(e) => updateSettings({ marksPerQuestion: parseFloat(e.target.value) || 0 })} style={{ width: 90 }} />
            </div>
            <div>
              <label className="label">Time (minutes)</label>
              <input type="number" value={settings.totalTimeMinutes} onChange={(e) => updateSettings({ totalTimeMinutes: parseInt(e.target.value) || 0 })} style={{ width: 90 }} />
            </div>
            <div>
              <label className="label">Deduct on Wrong</label>
              <input type="number" value={settings.negativeMarks} onChange={(e) => updateSettings({ negativeMarks: parseFloat(e.target.value) || 0 })} style={{ width: 90 }} />
            </div>
            <div>
              <label className="label">Allow Skip</label>
              <input type="checkbox" checked={settings.allowSkip} onChange={(e) => updateSettings({ allowSkip: e.target.checked })} style={{ width: 20, height: 20 }} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Scan questions</h3>
          <p className="muted-sm">Pick multiple photos and/or PDFs of a question bank — numbered questions, lettered choices, and an "Answer: C" style line parse best.</p>
          <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
            {scanning ? 'Reading…' : 'Select Images / PDFs'}
            <input type="file" accept="image/*,application/pdf" multiple onChange={handleFiles} disabled={scanning} style={{ display: 'none' }} />
          </label>
          {scanning && <p className="muted-sm" style={{ marginTop: 10 }}>{scanStatus}</p>}
        </div>

        {questions.map((q, qi) => (
          <div className="card" key={q.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Question {qi + 1}</strong>
              {questions.length > 1 && (
                <button className="btn-outline" onClick={() => removeQuestion(q.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Remove</button>
              )}
            </div>
            <input placeholder="Question text" value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)} />
            {q.choices.map((c, ci) => (
              <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => setCorrectChoice(q.id, ci)}
                  style={{
                    width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                    background: q.correctIndex === ci ? '#22c55e' : '#fff',
                    color: q.correctIndex === ci ? '#fff' : '#666',
                    border: '1.5px solid ' + (q.correctIndex === ci ? '#22c55e' : '#ccc'),
                    fontSize: 12, fontWeight: 700, padding: 0,
                  }}
                >{LETTERS[ci] || ci + 1}</button>
                <input placeholder={`Choice ${LETTERS[ci] || ci + 1}`} value={c} onChange={(e) => updateChoice(q.id, ci, e.target.value)} style={{ marginBottom: 0 }} />
              </div>
            ))}
            <button className="btn-outline" onClick={() => addChoice(q.id)} style={{ fontSize: 12, padding: '6px 12px' }}>+ Add choice</button>
          </div>
        ))}

        <button className="btn-outline" onClick={addQuestion} style={{ width: '100%', marginBottom: 16 }}>+ Add Question</button>

        <div className="card">
          <h3>Ready to start</h3>
          <p className="muted-sm">You have {poolSize} question{poolSize === 1 ? '' : 's'} in your bank.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="muted-sm">Give exam on</span>
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onBlur={commitSize}
              style={{ width: 70, marginBottom: 0 }}
            />
            <span className="muted-sm">of {poolSize}</span>
          </div>
          {poolSize > 1 && parseInt(sizeInput, 10) < poolSize && (
            <button className="btn-outline" onClick={handleRandomize} style={{ marginBottom: 10 }}>🔀 Randomize Selection</button>
          )}
          {usingSubset && (
            <p className="muted-sm" style={{ color: '#15803d' }}>
              This exam will use {examQuestions.length} randomly-picked question{examQuestions.length === 1 ? '' : 's'} from your bank.
            </p>
          )}
          <button className="btn-primary" onClick={handleStart} style={{ width: '100%', marginTop: 8 }}>Start Exam</button>
        </div>
      </div>
    </div>
  );
                                                                         }
