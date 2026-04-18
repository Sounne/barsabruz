import React from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = React.createContext(null)

export function AuthProvider({ children }) {
  // undefined = still loading, null = not logged in, object = logged in
  const [session, setSession] = React.useState(undefined)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
