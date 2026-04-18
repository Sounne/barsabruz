import React from 'react'
import {
  fetchBars, fetchAnnonces, fetchProfile, updateProfile,
  joinAnnonce as svcJoinAnnonce,
  joinAnnonceUser, unjoinAnnonceUser,
  fetchJoinedAnnonceIds, deleteAnnonce as svcDeleteAnnonce,
  subscribeToAnnonces, unsubscribeChannel,
} from '../services'
import { BARS_DATA, ANNONCES_PUBLIC, USER_DATA } from '../data'
import { useAuth } from './AuthContext'

const DataContext = React.createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [bars, setBars] = React.useState(null)
  const [annonces, setAnnonces] = React.useState(null)
  const [profile, setProfile] = React.useState(null)
  const [myJoins, setMyJoins] = React.useState(new Set())
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

  // Real-time subscription to annonces (new sorties, count updates, deletions)
  React.useEffect(() => {
    let channel
    try {
      channel = subscribeToAnnonces(() => {
        fetchAnnonces()
          .then(data => { if (data?.length) setAnnonces(data) })
          .catch(() => {})
      })
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
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

  // Load joined annonce IDs when auth user changes
  React.useEffect(() => {
    if (!user) { setMyJoins(new Set()); return }
    fetchJoinedAnnonceIds(user.id)
      .then(ids => setMyJoins(ids))
      .catch(() => {})
  }, [user?.id])

  const saveProfile = React.useCallback(async (updates) => {
    if (!user) return
    const updated = await updateProfile(user.id, updates)
    setProfile(updated)
    return updated
  }, [user?.id])

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

  // Join — optimistic update, then RPC (falls back to simple increment)
  const joinAnnonce = React.useCallback(async (annonceId, currentAttending) => {
    if (!user) return
    setAnnonces(prev => (prev ?? []).map(a =>
      a.id === annonceId ? { ...a, attending: a.attending + 1 } : a
    ))
    setMyJoins(prev => new Set([...prev, annonceId]))
    try {
      const newCount = await joinAnnonceUser(annonceId, user.id)
      setAnnonces(prev => (prev ?? []).map(a =>
        a.id === annonceId ? { ...a, attending: newCount } : a
      ))
    } catch {
      // RPC not available yet — fall back to count increment
      try {
        const newCount = await svcJoinAnnonce(annonceId, currentAttending)
        setAnnonces(prev => (prev ?? []).map(a =>
          a.id === annonceId ? { ...a, attending: newCount } : a
        ))
      } catch {}
    }
  }, [user?.id])

  // Unjoin — optimistic update, then RPC
  const unjoinAnnonce = React.useCallback(async (annonceId) => {
    if (!user) return
    setAnnonces(prev => (prev ?? []).map(a =>
      a.id === annonceId ? { ...a, attending: Math.max(0, a.attending - 1) } : a
    ))
    setMyJoins(prev => { const n = new Set(prev); n.delete(annonceId); return n })
    try {
      const newCount = await unjoinAnnonceUser(annonceId, user.id)
      setAnnonces(prev => (prev ?? []).map(a =>
        a.id === annonceId ? { ...a, attending: newCount } : a
      ))
    } catch {}
  }, [user?.id])

  // Delete own annonce — optimistic removal
  const deleteAnnonce = React.useCallback(async (annonceId) => {
    setAnnonces(prev => (prev ?? []).filter(a => a.id !== annonceId))
    setMyJoins(prev => { const n = new Set(prev); n.delete(annonceId); return n })
    try {
      await svcDeleteAnnonce(annonceId)
    } catch {}
  }, [])

  const addAnnonce = React.useCallback((annonce) => {
    setAnnonces(prev => [annonce, ...(prev ?? [])])
  }, [])

  const value = {
    bars: bars ?? BARS_DATA,
    annonces: annonces ?? ANNONCES_PUBLIC,
    user: userData,
    profile,
    saveProfile,
    joinAnnonce,
    unjoinAnnonce,
    deleteAnnonce,
    addAnnonce,
    joinedAnnonceIds: myJoins,
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
