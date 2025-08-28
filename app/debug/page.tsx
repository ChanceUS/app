// app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

type SessionT = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<SessionT>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!cancelled) {
          setSessionInfo(data.session);
          // stash the token so you can use it from DevTools/curl
          (window as any).__lastToken = data.session?.access_token ?? null;
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3>Supabase Debug</h3>
      <p><b>isSupabaseConfigured:</b> {String(isSupabaseConfigured)}</p>
      <p><b>Session token present:</b> {sessionInfo ? 'yes' : 'no'}</p>
      {sessionInfo && (
        <>
          <p><b>Access token (first 24 chars):</b> {sessionInfo.access_token.slice(0, 24)}…</p>
          <p><b>User ID:</b> {sessionInfo.user.id}</p>
          <p><b>Email:</b> {sessionInfo.user.email}</p>
        </>
      )}
      {err && <p style={{ color: 'crimson' }}>Error: {err}</p>}
    </main>
  );
}