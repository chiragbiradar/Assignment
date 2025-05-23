import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HomePage from './page.client'

export default async function HomePageWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect('/login')
  }

  return <HomePage user={user} />
}
