import { createBrowserClient } from '@supabase/ssr'

// NEXT_PUBLIC_ vars are required for browser bundle exposure in Next.js.
// Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your
// Vercel project settings (Settings → Vars) with the values from your Supabase project.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
