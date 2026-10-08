'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) router.replace(user ? '/home' : '/login'); }, [user, loading]);
  return <div className="container">Loading…</div>;
}
