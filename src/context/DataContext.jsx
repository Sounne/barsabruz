import React from 'react'
import {
  fetchBars, fetchAnnonces, fetchProfile, updateProfile,
  joinAnnonce as svcJoinAnnonce,
  joinAnnonceUser, unjoinAnnonceUser,
  fetchJoinedAnnonceIds, deleteAnnonce as svcDeleteAnnonce,
  subscribeToAnnonces, subscribeToAnnonceParticipants, unsubscribeChannel,
  fetchAnnonceParticipants, fetchAllAnnonceParticipants,
} from '../services'
import { getAccessibleGroups, getFriends } from '../lib/chatApi'
import { BARS_DATA, USER_DATA } from '../data'
import { useAuth } from './AuthContext'

const DataContext = React.createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [bars, setBars] = React.useState(null)
  const [annonces, setAnnonces] = React.useState(null)
  const [participantsMap, setParticipantsMap] = React.useState({})
  const [profile, setProfile] = React.useState(null)
  const [myJoins, setMyJoins] = React.useState(new Set())
  const [myGroups, setMyGroups] = React.useState([])
  const [friends, setFriends] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const loadParticipants = React.useCallback(async (annoncesList) => {
    const ids = (annoncesList ?? [])
      .filter(a => typeof a.id === 'string' && !a.id.startsWith('p'))
      .map(a => a.id)
    if (!ids.length) return
    try {
      const map = await fetchAllAnnonceParticipants(ids)
      setParticipantsMap(map)
      setAnnonces(prev => (prev ?? []).map(a =>
        typeof map[a.id] !== 'undefined'
          ? { ...a, attending: map[a.id].length }
          : a
      ))
    } catch (err) {
      console.warn('Failed to load annonce participants:', err?.message ?? err)
    }
  }, [])

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
          const resolvedAnnonces = annoncesData?.length ? annoncesData : []
          setBars(barsData?.length ? barsData : BARS_DATA)
          setAnnonces(resolvedAnnonces)
          if (annoncesData?.length) loadParticipants(annoncesData)
        }
      } catch (err) {
        console.warn('Supabase non disponible, données locales utilisées:', err.message)
        if (!cancelled) {
          setBars(BARS_DATA)
          setAnnonces([])
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
          .then(data => {
            if (data?.length) {
              setAnnonces(data)
              loadParticipants(data)
            }
          })
          .catch(() => {})
      })
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [])

  // Real-time subscription to annonce participants (join/unjoin updates)
  React.useEffect(() => {
    let channel
    try {
      channel = subscribeToAnnonceParticipants((payload) => {
        const annonceId = payload.new?.annonce_id ?? payload.old?.annonce_id
        if (!annonceId) return

        fetchAnnonceParticipants(annonceId)
          .then(participants => {
            setParticipantsMap(prev => ({
              ...prev,
              [annonceId]: participants,
            }))
            setAnnonces(prev => (prev ?? []).map(a =>
              a.id === annonceId ? { ...a, attending: participants.length } : a
            ))
          })
          .catch(err => {
            console.warn('Failed to refresh participants for annonce', annonceId, err?.message ?? err)
          })

        if (!user) return
        if (payload.new?.user_id === user.id) {
          setMyJoins(prev => new Set([...prev, annonceId]))
        }
        if (payload.old?.user_id === user.id) {
          setMyJoins(prev => { const n = new Set(prev); n.delete(annonceId); return n })
        }
      })
    } catch (err) {
      console.warn('Failed to subscribe to annonce participants:', err?.message ?? err)
    }
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [user?.id])

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

  // Load groups and friends when auth user changes
  React.useEffect(() => {
    if (!user) { setMyGroups([]); setFriends([]); return }
    getAccessibleGroups(user.id)
      .then(all => setMyGroups(all.filter(g => g.isMember)))
      .catch(() => {})
    getFriends(user.id)
      .then(setFriends)
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
    annonces: USER_DATA.annonces,
  } : USER_DATA

  // Join — optimistic update, then RPC (falls back to simple increment)
  const joinAnnonce = React.useCallback(async (annonceId, currentAttending) => {
    if (!user) return
    setAnnonces(prev => (prev ?? []).map(a =>
      a.id === annonceId ? { ...a, attending: a.attending + 1 } : a
    ))
    setMyJoins(prev => new Set([...prev, annonceId]))
    setParticipantsMap(prev => {
      const list = prev[annonceId] ?? []
      if (list.find(p => p.user_id === user.id)) return prev
      return {
        ...prev,
        [annonceId]: [...list, {
          user_id: user.id,
          name: profile?.name ?? '',
          avatar_letter: profile?.avatar_letter ?? '?',
          color: profile?.color ?? '#C65D3D',
          joined_at: new Date().toISOString(),
        }],
      }
    })
    try {
      const newCount = await joinAnnonceUser(annonceId, user.id)
      setAnnonces(prev => (prev ?? []).map(a =>
        a.id === annonceId ? { ...a, attending: newCount } : a
      ))
    } catch (err) {
      console.warn('joinAnnonce failed:', err?.message ?? err)
      try {
        const newCount = await svcJoinAnnonce(annonceId, currentAttending)
        setAnnonces(prev => (prev ?? []).map(a =>
          a.id === annonceId ? { ...a, attending: newCount } : a
        ))
      } catch (fallbackErr) {
        console.warn('Fallback joinAnnonce failed:', fallbackErr?.message ?? fallbackErr)
      }
    }
  }, [user?.id, profile])

  // Unjoin — optimistic update, then RPC
  const unjoinAnnonce = React.useCallback(async (annonceId) => {
    if (!user) return
    setAnnonces(prev => (prev ?? []).map(a =>
      a.id === annonceId ? { ...a, attending: Math.max(0, a.attending - 1) } : a
    ))
    setMyJoins(prev => { const n = new Set(prev); n.delete(annonceId); return n })
    setParticipantsMap(prev => ({
      ...prev,
      [annonceId]: (prev[annonceId] ?? []).filter(p => p.user_id !== user.id),
    }))
    try {
      const newCount = await unjoinAnnonceUser(annonceId, user.id)
      setAnnonces(prev => (prev ?? []).map(a =>
        a.id === annonceId ? { ...a, attending: newCount } : a
      ))
    } catch (err) {
      console.warn('unjoinAnnonce failed:', err?.message ?? err)
    }
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
    annonces: annonces ?? [],
    participantsMap,
    user: userData,
    profile,
    saveProfile,
    joinAnnonce,
    unjoinAnnonce,
    deleteAnnonce,
    addAnnonce,
    joinedAnnonceIds: myJoins,
    myGroups,
    friends,
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
