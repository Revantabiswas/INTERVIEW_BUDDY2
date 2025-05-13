'use client'

import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Create a Supabase client for the browser
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Singleton instance to avoid multiple instances
let browserSupabase = null

// Get a singleton instance of the Supabase client for the browser
export function getBrowserSupabaseClient() {
  if (!browserSupabase) {
    browserSupabase = createBrowserSupabaseClient()
  }
  return browserSupabase
}

// Sign in with email/password
export async function signInWithEmail(email, password) {
  const supabase = getBrowserSupabaseClient()
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

// Sign up with email/password
export async function signUpWithEmail(email, password, metadata = {}) {
  const supabase = getBrowserSupabaseClient()
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

// Sign out the current user
export async function signOut() {
  const supabase = getBrowserSupabaseClient()
  return await supabase.auth.signOut()
}

// Get the current user session
export async function getCurrentSession() {
  const supabase = getBrowserSupabaseClient()
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

// Get the current user
export async function getCurrentUser() {
  const { session } = await getCurrentSession()
  return session?.user || null
}