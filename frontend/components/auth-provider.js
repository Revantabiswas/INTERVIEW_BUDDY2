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
    // Fetch the current user when the component mounts
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting current user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
        router.refresh()
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