import React from 'react'
import { fetchBars, fetchAnnonces, fetchProfile, updateProfile } from '../services'
import { BARS_DATA, ANNONCES_PUBLIC, USER_DATA } from '../data'
import { useAuth } from './AuthContext'

const DataContext = React.createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [bars, setBars] = React.useState(null)
  const [annonces, setAnnonces] = React.useState(null)
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  // Load bars + annonces once
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [barsData, annoncesData] = await Promise.all([
          fetchBars(),
          fetchAnnonces(),
        ])
        if (!cancelled) {
          setBars(barsData?.length ? barsData : BARS_DATA)
          setAnnonces(annoncesData?.length ? annoncesData : ANNONCES_PUBLIC)
        }
      } catch (err) {
        console.warn('Supabase non disponible, données locales utilisées:', err.message)
        if (!cancelled) {
          setBars(BARS_DATA)
          setAnnonces(ANNONCES_PUBLIC)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load profile when auth user changes
  React.useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    fetchProfile(user.id)
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [user?.id])

  // Save profile to Supabase and update local state
  const saveProfile = React.useCallback(async (updates) => {
    if (!user) return
    const updated = await updateProfile(user.id, updates)
    setProfile(updated)
    return updated
  }, [user?.id])

  // Build user object: Supabase profile when logged in, mock otherwise
  const userData = profile ? {
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar_letter,
    color: profile.color || '#C65D3D',
    bio: profile.bio || '',
    favorites: profile.favorites ?? [],
    sorties: USER_DATA.sorties,
    groups: USER_DATA.groups,
    annonces: USER_DATA.annonces,
  } : USER_DATA

  const value = {
    bars: bars ?? BARS_DATA,
    annonces: annonces ?? ANNONCES_PUBLIC,
    user: userData,
    profile,
    saveProfile,
    loading,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = React.useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
