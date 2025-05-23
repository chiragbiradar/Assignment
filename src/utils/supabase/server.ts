import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
  // Create a Supabase client without cookies for server-side operations
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
