import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Export the context so admin providers can use the same context object
export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Supabase is not configured, skip auth
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithDiscord = async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase is not configured')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
    })
    if (error) {
      console.error('Error signing in with Discord:', error.message)
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
  }

  const value = {
    user,
    loading,
    signInWithDiscord,
    signOut,
    isSupabaseConfigured,
    isAdminMode: false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function isUserAdmin() {
  return false;
}
