import React from 'react'
import {
  fetchBars, fetchAnnonces, fetchProfile, updateProfile,
  joinAnnonce as svcJoinAnnonce,
  joinAnnonceUser, unjoinAnnonceUser,
  fetchJoinedAnnonceIds, deleteAnnonce as svcDeleteAnnonce,
  subscribeToAnnonces, unsubscribeChannel,
  subscribeToAnnonceParticipants, subscribeToAnnonceInvitations,
  fetchAllAnnonceParticipants,
  fetchPendingInvitations,
  acceptAnnonceInvitation, declineAnnonceInvitation,
  sendAnnonceInvitations,
} from '../services'
import { getAccessibleGroups, getFriends } from '../lib/chatApi'
import { BARS_DATA, ANNONCES_PUBLIC, USER_DATA } from '../data'
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
  const [invitations, setInvitations] = React.useState([])
  const [notificationReadIds, setNotificationReadIds] = React.useState(new Set())
  const [notificationDismissedIds, setNotificationDismissedIds] = React.useState(new Set())
  const [notificationSettings, setNotificationSettings] = React.useState({
    invitations: true,
    participants: true,
    sorties: true,
    events: true,
    browser: false,
  })
  const [notificationPermission, setNotificationPermission] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [loading, setLoading] = React.useState(true)
  const skipNotificationWriteRef = React.useRef(true)
  const skipNotificationSettingsWriteRef = React.useRef(true)

  const notificationStorageKey = React.useMemo(
    () => `barsabruz:notifications:${user?.id ?? 'guest'}`,
    [user?.id]
  )

  const notificationSettingsKey = React.useMemo(
    () => `barsabruz:notification-settings:${user?.id ?? 'guest'}`,
    [user?.id]
  )

  const readStorage = React.useCallback((key, fallback) => {
    try {
      const value = window.localStorage.getItem(key)
      return value ? JSON.parse(value) : fallback
    } catch {
      return fallback
    }
  }, [])

  const writeStorage = React.useCallback((key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [])

  const refreshInvitations = React.useCallback(async () => {
    if (!user) { setInvitations([]); return }
    try {
      const list = await fetchPendingInvitations(user.id)
      setInvitations(list)
    } catch {
      setInvitations([])
    }
  }, [user?.id])

  const loadParticipants = React.useCallback(async (annoncesList) => {
    const ids = (annoncesList ?? [])
      .filter(a => typeof a.id === 'string' && !a.id.startsWith('p'))
      .map(a => a.id)
    if (!ids.length) return
    try {
      const map = await fetchAllAnnonceParticipants(ids)
      setParticipantsMap(map)
    } catch {}
  }, [])

  React.useEffect(() => {
    skipNotificationWriteRef.current = true
    skipNotificationSettingsWriteRef.current = true
    const state = readStorage(notificationStorageKey, { read: [], dismissed: [] })
    setNotificationReadIds(new Set(state.read ?? []))
    setNotificationDismissedIds(new Set(state.dismissed ?? []))
    setNotificationSettings(prev => ({
      ...prev,
      ...readStorage(notificationSettingsKey, {}),
    }))
  }, [notificationStorageKey, notificationSettingsKey, readStorage])

  React.useEffect(() => {
    if (skipNotificationWriteRef.current) {
      skipNotificationWriteRef.current = false
      return
    }
    writeStorage(notificationStorageKey, {
      read: [...notificationReadIds],
      dismissed: [...notificationDismissedIds],
    })
  }, [notificationStorageKey, notificationReadIds, notificationDismissedIds, writeStorage])

  React.useEffect(() => {
    if (skipNotificationSettingsWriteRef.current) {
      skipNotificationSettingsWriteRef.current = false
      return
    }
    writeStorage(notificationSettingsKey, notificationSettings)
  }, [notificationSettingsKey, notificationSettings, writeStorage])

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
          const resolvedAnnonces = annoncesData?.length ? annoncesData : ANNONCES_PUBLIC
          setBars(barsData?.length ? barsData : BARS_DATA)
          setAnnonces(resolvedAnnonces)
          if (annoncesData?.length) loadParticipants(annoncesData)
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

  React.useEffect(() => {
    let channel
    try {
      channel = subscribeToAnnonceParticipants(() => {
        fetchAnnonces()
          .then(data => {
            if (data?.length) loadParticipants(data)
          })
          .catch(() => {})
      })
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [loadParticipants])

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
    if (!user) { setMyGroups([]); setFriends([]); setInvitations([]); return }
    getAccessibleGroups(user.id)
      .then(all => setMyGroups(all.filter(g => g.isMember)))
      .catch(() => {})
    getFriends(user.id)
      .then(setFriends)
      .catch(() => {})
    refreshInvitations()
  }, [user?.id])

  React.useEffect(() => {
    if (!user) return
    let channel
    try {
      channel = subscribeToAnnonceInvitations(user.id, refreshInvitations)
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [user?.id, refreshInvitations])

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
    avatarUrl: profile.avatar_url || null,
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
          avatar_url: profile?.avatar_url ?? null,
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
    } catch {
      // RPC not available yet — fall back to count increment
      try {
        const newCount = await svcJoinAnnonce(annonceId, currentAttending)
        setAnnonces(prev => (prev ?? []).map(a =>
          a.id === annonceId ? { ...a, attending: newCount } : a
        ))
      } catch {}
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

  const acceptInvitation = React.useCallback(async (invitationId) => {
    const inv = invitations.find(i => i.invitationId === invitationId)
    setInvitations(prev => prev.filter(i => i.invitationId !== invitationId))
    try {
      const newCount = await acceptAnnonceInvitation(invitationId)
      if (inv) {
        const existing = (annonces ?? []).some(a => a.id === inv.annonce.id)
        setAnnonces(prev => {
          const list = prev ?? []
          if (existing) {
            return list.map(a => a.id === inv.annonce.id ? { ...a, attending: newCount } : a)
          }
          return [{ ...inv.annonce, attending: newCount }, ...list]
        })
        setMyJoins(prev => new Set([...prev, inv.annonce.id]))
      }
    } catch (err) {
      console.error(err)
      refreshInvitations()
    }
  }, [invitations, annonces, refreshInvitations])

  const declineInvitation = React.useCallback(async (invitationId) => {
    setInvitations(prev => prev.filter(i => i.invitationId !== invitationId))
    try { await declineAnnonceInvitation(invitationId) } catch (err) { console.error(err); refreshInvitations() }
  }, [refreshInvitations])

  const inviteFriendsToAnnonce = React.useCallback(async (annonceId, inviteeIds) => {
    if (!user || !inviteeIds?.length) return
    await sendAnnonceInvitations(annonceId, user.id, inviteeIds)
  }, [user?.id])

  const notifications = React.useMemo(() => {
    if (!user) return []

    const items = []
    const list = annonces ?? ANNONCES_PUBLIC
    const now = Date.now()

    if (notificationSettings.invitations) {
      invitations.forEach(inv => {
        items.push({
          id: `invitation:${inv.invitationId}`,
          type: 'invitation',
          icon: 'users',
          color: inv.inviter?.color || 'var(--terracotta)',
          title: `${inv.inviter?.name ?? 'Quelqu\'un'} t'invite`,
          body: `${inv.annonce.title} - ${inv.annonce.when} chez ${inv.annonce.bar}`,
          time: 'A traiter',
          createdAt: inv.createdAt,
          priority: 4,
          invitation: inv,
          annonce: inv.annonce,
        })
      })
    }

    if (user && notificationSettings.participants) {
      list
        .filter(a => a.user_id === user.id)
        .forEach(a => {
          ;(participantsMap[a.id] ?? [])
            .filter(p => p.user_id !== user.id)
            .slice(-4)
            .forEach(p => {
              items.push({
                id: `participant:${a.id}:${p.user_id}`,
                type: 'participant',
                icon: 'check',
                color: p.color || a.color || 'var(--success)',
                title: `${p.name || 'Un participant'} rejoint ta sortie`,
                body: a.title,
                time: 'Nouvelle participation',
                createdAt: p.joined_at,
                priority: 3,
                annonce: a,
              })
            })
        })
    }

    if (notificationSettings.sorties) {
      list
        .filter(a => !user || a.user_id !== user.id)
        .filter(a => !myJoins.has(a.id))
        .slice(0, 6)
        .forEach((a, index) => {
          items.push({
            id: `sortie:${a.id}`,
            type: 'sortie',
            icon: 'bell',
            color: a.color || 'var(--terracotta)',
            title: `${a.author || 'Quelqu\'un'} propose une sortie`,
            body: `${a.title} - ${a.when} chez ${a.bar}`,
            time: 'Sortie ouverte',
            createdAt: a.created_at || new Date(now - (index + 1) * 60000).toISOString(),
            priority: 2,
            annonce: a,
          })
        })
    }

    if (notificationSettings.events) {
      ;(bars ?? BARS_DATA)
        .flatMap(bar => (bar.events ?? []).map(event => ({ ...event, bar })))
        .slice(0, 5)
        .forEach((event, index) => {
          items.push({
            id: `event:${event.id}`,
            type: 'event',
            icon: 'calendar',
            color: event.bar.color,
            title: event.title,
            body: `${event.date} - ${event.time} chez ${event.bar.name}`,
            time: 'Evenement a venir',
            createdAt: new Date(now - (index + 8) * 60000).toISOString(),
            priority: 1,
            event,
          })
        })
    }

    return items
      .filter(n => !notificationDismissedIds.has(n.id))
      .map(n => ({ ...n, read: notificationReadIds.has(n.id) }))
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        if (a.priority !== b.priority) return b.priority - a.priority
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
  }, [
    annonces,
    bars,
    invitations,
    myJoins,
    notificationDismissedIds,
    notificationReadIds,
    notificationSettings,
    participantsMap,
    user?.id,
  ])

  const unreadNotificationCount = React.useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  React.useEffect(() => {
    if (!user) return
    if (!notificationSettings.browser || notificationPermission !== 'granted') return
    const latest = notifications.find(n => !n.read && ['invitation', 'participant'].includes(n.type))
    if (!latest) return
    const key = `barsabruz:last-browser-notification:${user?.id ?? 'guest'}`
    if (readStorage(key, null) === latest.id) return
    try {
      new Notification(latest.title, { body: latest.body })
      writeStorage(key, latest.id)
    } catch {}
  }, [notificationPermission, notificationSettings.browser, notifications, readStorage, user?.id, writeStorage])

  const markNotificationRead = React.useCallback((id) => {
    setNotificationReadIds(prev => new Set([...prev, id]))
  }, [])

  const markAllNotificationsRead = React.useCallback(() => {
    setNotificationReadIds(prev => new Set([...prev, ...notifications.map(n => n.id)]))
  }, [notifications])

  const dismissNotification = React.useCallback((id) => {
    setNotificationReadIds(prev => new Set([...prev, id]))
    setNotificationDismissedIds(prev => new Set([...prev, id]))
  }, [])

  const updateNotificationSetting = React.useCallback((key, value) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const requestBrowserNotifications = React.useCallback(async () => {
    if (!user) return 'unsupported'
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported')
      return 'unsupported'
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    setNotificationSettings(prev => ({ ...prev, browser: permission === 'granted' }))
    return permission
  }, [user])

  const value = {
    bars: bars ?? BARS_DATA,
    annonces: annonces ?? ANNONCES_PUBLIC,
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
    invitations,
    notifications,
    unreadNotificationCount,
    notificationSettings,
    notificationPermission,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    updateNotificationSetting,
    requestBrowserNotifications,
    acceptInvitation,
    declineInvitation,
    inviteFriendsToAnnonce,
    refreshInvitations,
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
