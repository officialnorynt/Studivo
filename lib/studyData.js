import {
  doc, setDoc, updateDoc, getDoc, addDoc, collection,
  serverTimestamp, increment, getDocs, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase';

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function initUserProfile(uid, { displayName, email, isPasswordAccount }) {
  const publicData = {
    displayName: displayName || '',
    createdAt: serverTimestamp(),
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalStudySeconds: 0,
    dailyTotals: {},
  };
  if (isPasswordAccount) publicData.passwordChangedAt = serverTimestamp();
  await setDoc(doc(db, 'users', uid), publicData, { merge: true });
  await setDoc(doc(db, 'users', uid, 'private', 'profile'), { email: email || '' }, { merge: true });
}

export async function startSession(uid) {
  const ref = await addDoc(collection(db, 'users', uid, 'sessions'), {
    startedAt: serverTimestamp(),
    endedAt: null,
  });
  return ref.id;
}

export async function endSession(uid, sessionId) {
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);
  await updateDoc(sessionRef, { endedAt: serverTimestamp() });
  const snap = await getDoc(sessionRef);
  const data = snap.data();
  const start = data?.startedAt?.toDate();
  const end = data?.endedAt?.toDate();
  if (!start || !end) return 0;
  const seconds = Math.max(0, Math.round((end - start) / 1000));

  const userRef = doc(db, 'users', uid);
  const key = todayKey(end);
  await updateDoc(userRef, {
    totalStudySeconds: increment(seconds),
    [`dailyTotals.${key}`]: increment(seconds),
  });
  await updateStreak(uid, key);
  return seconds;
}

async function updateStreak(uid, todayStr) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};
  const last = data.lastStudyDate;
  let currentStreak = data.currentStreak || 0;
  if (last !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = todayKey(yesterday);
    currentStreak = last === yStr ? currentStreak + 1 : 1;
  }
  const longestStreak = Math.max(currentStreak, data.longestStreak || 0);
  await updateDoc(userRef, { currentStreak, longestStreak, lastStudyDate: todayStr });
}

export async function getUserStats(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function getLeaderboard(range = 'daily', topN = 10) {
  const usersSnap = await getDocs(collection(db, 'users'));
  const today = todayKey();
  const rows = [];
  usersSnap.forEach((d) => {
    const u = d.data();
    const daily = u.dailyTotals || {};
    let value = 0;
    if (range === 'daily') value = daily[today] || 0;
    else if (range === 'weekly') {
      for (let i = 0; i < 7; i++) {
        const day = new Date(); day.setDate(day.getDate() - i);
        value += daily[todayKey(day)] || 0;
      }
    } else if (range === 'monthly') {
      for (let i = 0; i < 30; i++) {
        const day = new Date(); day.setDate(day.getDate() - i);
        value += daily[todayKey(day)] || 0;
      }
    } else value = u.totalStudySeconds || 0;
    rows.push({ uid: d.id, name: u.displayName || 'Studivo user', seconds: value });
  });
  rows.sort((a, b) => b.seconds - a.seconds);
  return rows.slice(0, topN);
}

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export async function getSessionHistory(uid, topN = 50) {
  const q = query(collection(db, 'users', uid, 'sessions'), orderBy('startedAt', 'desc'), limit(topN));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      const start = data.startedAt?.toDate ? data.startedAt.toDate() : null;
      const end = data.endedAt?.toDate ? data.endedAt.toDate() : null;
      const seconds = start && end ? Math.round((end - start) / 1000) : 0;
      return { id: d.id, start, end, seconds };
    })
    .filter((s) => s.end);
}

export function todayKeyExport() { return todayKey(); }
export function weekDayKeys() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
