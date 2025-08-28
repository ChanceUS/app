'use client';

import { supabase } from '@/lib/supabaseClient';

export default function ClientInit() {
  // expose the client once on the browser
  if (typeof window !== 'undefined' && !(window as any).supabase) {
    (window as any).supabase = supabase;
    // optional: stash token for quick testing
    supabase.auth.getSession().then(({ data }) => {
      (window as any).__lastToken = data.session?.access_token ?? null;
    });
  }
  return null;
}