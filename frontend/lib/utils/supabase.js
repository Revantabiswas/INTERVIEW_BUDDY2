import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Initialize Supabase for server-side operations
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => {
          return cookieStore.get(name)?.value
        },
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Get authenticated user on the server side
export async function getServerSession() {
  const supabase = createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Get authenticated user on the server side
export async function getServerUser() {
  const session = await getServerSession()
  return session?.user || null
}

// Check if user is authenticated on server side
export async function requireAuth() {
  const user = await getServerUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}