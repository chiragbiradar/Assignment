'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      router.push('/login?error=' + encodeURIComponent(error.message))
      return false
    }

    router.push('/')
    router.refresh()
    return true
  }

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
      },
    })

    if (error) {
      router.push('/login?error=' + encodeURIComponent(error.message))
      return false
    }

    router.push('/login?message=Check your email to confirm your sign up')
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return { login, signup, logout }
}
