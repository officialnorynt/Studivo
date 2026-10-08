'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

const ExamContext = createContext(null);

function newQuestion() {
  return { id: Math.random().toString(36).slice(2), text: '', choices: ['', '', '', ''], correctIndex: null };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ExamProvider({ children }) {
  const [settings, setSettings] = useState({ totalTimeMinutes: 30, marksPerQuestion: 1, negativeMarks: 0, allowSkip: true });
  const [questions, setQuestions] = useState([newQuestion()]);
  const [selectedIds, setSelectedIds] = useState(null); // null = use the full pool
  const [answers, setAnswers] = useState({});
  const [examStartedAt, setExamStartedAt] = useState(null);

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const addQuestion = useCallback(() => setQuestions((qs) => [...qs, newQuestion()]), []);
  const removeQuestion = useCallback((id) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setSelectedIds((ids) => (ids ? ids.filter((i) => i !== id) : ids));
  }, []);
  const updateQuestionText = useCallback((id, text) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, text } : q)));
  }, []);
  const updateChoice = useCallback((id, idx, value) => {
    setQuestions((qs) => qs.map((q) => {
      if (q.id !== id) return q;
      const choices = [...q.choices];
      choices[idx] = value;
      return { ...q, choices };
    }));
  }, []);
  const addChoice = useCallback((id) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, choices: [...q.choices, ''] } : q)));
  }, []);
  const setCorrectChoice = useCallback((id, idx) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, correctIndex: idx } : q)));
  }, []);
  const appendParsedQuestions = useCallback((parsed) => {
    setQuestions((qs) => {
      const cleaned = qs.filter((q) => q.text.trim() || q.choices.some((c) => c.trim()));
      return [...cleaned, ...parsed];
    });
  }, []);

  // Exam-size selection: how many of the pool's questions this exam
  // run uses. Below the pool size, defaults to the first N until
  // randomizeSelection() is called.
  const setExamSize = useCallback((n) => {
    setQuestions((qs) => {
      const max = qs.length;
      const size = Math.max(1, Math.min(max, Math.round(n) || 1));
      setSelectedIds(size >= max ? null : qs.slice(0, size).map((q) => q.id));
      return qs;
    });
  }, []);

  const randomizeSelection = useCallback((n) => {
    setQuestions((qs) => {
      const max = qs.length;
      const size = Math.max(1, Math.min(max, Math.round(n) || max));
      setSelectedIds(shuffle(qs).slice(0, size).map((q) => q.id));
      return qs;
    });
  }, []);

  const examQuestions = selectedIds ? questions.filter((q) => selectedIds.includes(q.id)) : questions;

  const resetExam = useCallback(() => {
    setQuestions([newQuestion()]);
    setSelectedIds(null);
    setAnswers({});
    setExamStartedAt(null);
  }, []);
  const startExam = useCallback(() => { setAnswers({}); setExamStartedAt(Date.now()); }, []);
  const setAnswer = useCallback((id, choiceIndex) => setAnswers((a) => ({ ...a, [id]: choiceIndex })), []);
  const skipQuestion = useCallback((id) => setAnswers((a) => ({ ...a, [id]: 'skipped' })), []);

  const computeResults = useCallback(() => {
    const pool = selectedIds ? questions.filter((q) => selectedIds.includes(q.id)) : questions;
    let correct = 0, incorrect = 0, skipped = 0, deducted = 0;
    const maxMarks = pool.length * settings.marksPerQuestion;
    const detail = [];
    pool.forEach((q) => {
      const ans = answers[q.id];
      if (ans === undefined || ans === 'skipped') {
        skipped += 1;
        detail.push({ text: q.text, choices: q.choices, correctIndex: q.correctIndex, given: null, outcome: 'skipped' });
      } else if (ans === q.correctIndex) {
        correct += 1;
        detail.push({ text: q.text, choices: q.choices, correctIndex: q.correctIndex, given: ans, outcome: 'correct' });
      } else {
        incorrect += 1;
        deducted += settings.negativeMarks;
        detail.push({ text: q.text, choices: q.choices, correctIndex: q.correctIndex, given: ans, outcome: 'incorrect' });
      }
    });
    const scored = Math.max(0, correct * settings.marksPerQuestion - deducted);
    const attempted = correct + incorrect;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { correct, incorrect, skipped, deducted, maxMarks, scored, accuracy, total: pool.length, detail };
  }, [questions, selectedIds, answers, settings]);

  return (
    <ExamContext.Provider value={{
      settings, updateSettings,
      questions, addQuestion, removeQuestion, updateQuestionText, updateChoice, addChoice, setCorrectChoice, appendParsedQuestions,
      selectedIds, setExamSize, randomizeSelection, examQuestions,
      answers, setAnswer, skipQuestion,
      examStartedAt, startExam, resetExam,
      computeResults,
    }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within ExamProvider');
  return ctx;
}
