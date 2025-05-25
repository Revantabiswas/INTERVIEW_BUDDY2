'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient, getCurrentUser } from '@/lib/utils/supabase-browser'

// Create a context for authentication state
export const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
})

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Provider component to wrap app with auth context
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getBrowserSupabaseClient()

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }
  useEffect(() => {
    // Get initial session immediately for faster auth state detection
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
        
        // Only refresh on sign out to avoid unnecessary re-renders
        if (event === 'SIGNED_OUT') {
          router.refresh()
        }
      }
    )

    // Clean up subscription when component unmounts
    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}