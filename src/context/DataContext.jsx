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
  fetchAllEventParticipants, fetchJoinedEventIds,
  joinEvent as svcJoinEvent, unjoinEvent as svcUnjoinEvent,
  subscribeToBars, subscribeToEvents, subscribeToEventAttendees,
  cleanupExpiredAgendaItems,
} from '../services'
import {
  getAccessibleGroups, getFriends, subscribeToFriendships, unsubscribe,
  getSocialUnreadSummary, subscribeToSocialUnreadChanges,
} from '../lib/chatApi'
import { getWebPushStatus, subscribeUserToPush, unsubscribeUserFromPush, getPushPreferences, updatePushPreference } from '../lib/webPush'
import { BARS_DATA, ANNONCES_PUBLIC, USER_DATA } from '../data'
import { useAuth } from './AuthContext'
import { getBarEvents, getEventTags } from '../utils/events'

const DataContext = React.createContext(null)

function updateEventInBars(list, eventId, updater) {
  return (list ?? []).map(bar => ({
    ...bar,
    events: (bar.events ?? []).map(event => (
      event.id === eventId ? updater(event, bar) : event
    )),
  }))
}

function syncBarsEventCounts(list, participantsMap) {
  if (!participantsMap) return list ?? []
  return (list ?? []).map(bar => ({
    ...bar,
    events: (bar.events ?? []).map(event => ({
      ...event,
      attending: participantsMap[event.id]?.length ?? 0,
    })),
  }))
}

function removeAnnonceParticipants(map, annonceId) {
  if (!map?.[annonceId]) return map ?? {}
  const { [annonceId]: _removed, ...next } = map
  return next
}

function notificationBelongsToAnnonce(notificationId, annonceId) {
  return (
    notificationId === `sortie:${annonceId}` ||
    notificationId.startsWith(`participant:${annonceId}:`)
  )
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [bars, setBars] = React.useState(null)
  const [annonces, setAnnonces] = React.useState(null)
  const [participantsMap, setParticipantsMap] = React.useState({})
  const [eventParticipantsMap, setEventParticipantsMap] = React.useState({})
  const [profile, setProfile] = React.useState(null)
  const [myJoins, setMyJoins] = React.useState(new Set())
  const [joinedEventIds, setJoinedEventIds] = React.useState(new Set())
  const [myGroups, setMyGroups] = React.useState([])
  const [friends, setFriends] = React.useState([])
  const [socialUnread, setSocialUnread] = React.useState({ groups: 0, friends: 0, total: 0 })
  const [invitations, setInvitations] = React.useState([])
  const [notificationReadIds, setNotificationReadIds] = React.useState(new Set())
  const [notificationDismissedIds, setNotificationDismissedIds] = React.useState(new Set())
  const [notificationSettings, setNotificationSettings] = React.useState({
    invitations: true,
    participants: true,
    sorties: true,
    events: true,
    messages: true,
    browser: false,
  })
  const [notificationPermission, setNotificationPermission] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [webPushStatus, setWebPushStatus] = React.useState({
    supported: false,
    configured: false,
    subscribed: false,
    permission: 'unsupported',
    error: '',
  })
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

  const refreshWebPushStatus = React.useCallback(async () => {
    try {
      const status = await getWebPushStatus()
      setWebPushStatus(prev => ({ ...prev, ...status, error: '' }))
      setNotificationPermission(status.permission)
      setNotificationSettings(prev => ({
        ...prev,
        browser: status.subscribed && status.permission === 'granted',
      }))
      return status
    } catch (err) {
      setWebPushStatus(prev => ({ ...prev, error: err.message || 'Statut push indisponible' }))
      return null
    }
  }, [])

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
    if (!ids.length) {
      setParticipantsMap({})
      return
    }
    try {
      const map = await fetchAllAnnonceParticipants(ids)
      setParticipantsMap(map)
    } catch {}
  }, [])

  const loadEventParticipants = React.useCallback(async (barsList) => {
    const ids = getBarEvents(barsList ?? [], { includePast: true }).map(event => event.id)
    if (!ids.length) {
      setEventParticipantsMap({})
      return
    }
    try {
      const map = await fetchAllEventParticipants(ids)
      setEventParticipantsMap(map)
      setBars(prev => syncBarsEventCounts(prev, map))
    } catch {}
  }, [])

  const refreshJoinedAnnonces = React.useCallback(() => {
    if (!user) {
      setMyJoins(new Set())
      return Promise.resolve()
    }
    return fetchJoinedAnnonceIds(user.id)
      .then(ids => setMyJoins(ids))
      .catch(() => {})
  }, [user?.id])

  const refreshJoinedEvents = React.useCallback(() => {
    if (!user) {
      setJoinedEventIds(new Set())
      return Promise.resolve()
    }
    return fetchJoinedEventIds(user.id)
      .then(ids => setJoinedEventIds(ids))
      .catch(() => setJoinedEventIds(new Set()))
  }, [user?.id])

  const removeAnnonceEverywhere = React.useCallback((annonceId) => {
    if (!annonceId) return

    setAnnonces(prev => (prev ?? []).filter(a => a.id !== annonceId))
    setParticipantsMap(prev => removeAnnonceParticipants(prev, annonceId))
    setMyJoins(prev => {
      if (!prev.has(annonceId)) return prev
      const next = new Set(prev)
      next.delete(annonceId)
      return next
    })
    setInvitations(prev => prev.filter(inv => inv.annonce?.id !== annonceId))
    setNotificationReadIds(prev => new Set([...prev].filter(id => !notificationBelongsToAnnonce(id, annonceId))))
    setNotificationDismissedIds(prev => new Set([...prev].filter(id => !notificationBelongsToAnnonce(id, annonceId))))
  }, [])

  const applyAnnoncesSnapshot = React.useCallback((data) => {
    const next = data ?? []
    const activeIds = new Set(next.map(a => a.id))

    setAnnonces(next)
    setParticipantsMap(prev => (
      Object.fromEntries(Object.entries(prev ?? {}).filter(([id]) => activeIds.has(id)))
    ))
    setMyJoins(prev => new Set([...prev].filter(id => activeIds.has(id))))
    setInvitations(prev => prev.filter(inv => activeIds.has(inv.annonce?.id)))
    loadParticipants(next)
    refreshJoinedAnnonces()
    refreshInvitations()
  }, [loadParticipants, refreshInvitations, refreshJoinedAnnonces])

  const cleanupAndRefreshAgenda = React.useCallback(async () => {
    const result = await cleanupExpiredAgendaItems()
    const deletedCount = (result?.events_deleted ?? 0) + (result?.annonces_deleted ?? 0)
    if (!deletedCount) return result

    const [barsData, annoncesData] = await Promise.all([
      fetchBars(),
      fetchAnnonces(),
    ])
    const resolvedBars = barsData?.length ? barsData : BARS_DATA
    const resolvedAnnonces = annoncesData ?? ANNONCES_PUBLIC
    setBars(resolvedBars)
    applyAnnoncesSnapshot(resolvedAnnonces)
    loadEventParticipants(resolvedBars)
    refreshJoinedAnnonces()
    refreshJoinedEvents()
    return result
  }, [applyAnnoncesSnapshot, loadEventParticipants, refreshJoinedAnnonces, refreshJoinedEvents])

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

  React.useEffect(() => {
    if (!user) {
      setWebPushStatus(prev => ({ ...prev, subscribed: false }))
      return
    }
    refreshWebPushStatus()
  }, [user?.id, refreshWebPushStatus])

  // Load bars + annonces once
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await cleanupExpiredAgendaItems().catch(() => {})
        const [barsData, annoncesData] = await Promise.all([
          fetchBars(),
          fetchAnnonces(),
        ])
        if (!cancelled) {
          const resolvedAnnonces = annoncesData ?? ANNONCES_PUBLIC
          const resolvedBars = barsData?.length ? barsData : BARS_DATA
          setBars(resolvedBars)
          applyAnnoncesSnapshot(resolvedAnnonces)
          loadEventParticipants(resolvedBars)
        }
      } catch (err) {
        console.warn('Supabase non disponible, données locales utilisées:', err.message)
        if (!cancelled) {
          setBars(BARS_DATA)
          setAnnonces(ANNONCES_PUBLIC)
          setEventParticipantsMap({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [applyAnnoncesSnapshot, loadEventParticipants])

  React.useEffect(() => {
    let channel
    try {
      channel = subscribeToAnnonceParticipants(() => {
        fetchAnnonces()
          .then(data => applyAnnoncesSnapshot(data ?? []))
          .catch(() => {})
      })
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [applyAnnoncesSnapshot])

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      cleanupAndRefreshAgenda().catch(() => {})
    }, 60000)
    return () => window.clearInterval(timer)
  }, [cleanupAndRefreshAgenda])

  // Real-time subscription to annonces (new sorties, count updates, deletions)
  React.useEffect(() => {
    let channel
    try {
      channel = subscribeToAnnonces((payload) => {
        if (payload?.eventType === 'DELETE') {
          removeAnnonceEverywhere(payload.old?.id)
        }

        fetchAnnonces()
          .then(data => applyAnnoncesSnapshot(data ?? []))
          .catch(() => {})
      })
    } catch {}
    return () => { if (channel) unsubscribeChannel(channel) }
  }, [applyAnnoncesSnapshot, removeAnnonceEverywhere])

  React.useEffect(() => {
    const refreshEvents = () => {
      fetchBars()
        .then(data => {
          const resolvedBars = data?.length ? data : BARS_DATA
          setBars(resolvedBars)
          loadEventParticipants(resolvedBars)
          refreshJoinedEvents()
        })
        .catch(() => {})
    }

    let barsChannel
    let eventsChannel
    let attendeesChannel
    try {
      barsChannel = subscribeToBars(refreshEvents)
      eventsChannel = subscribeToEvents(refreshEvents)
      attendeesChannel = subscribeToEventAttendees(refreshEvents)
    } catch {}

    return () => {
      if (barsChannel) unsubscribeChannel(barsChannel)
      if (eventsChannel) unsubscribeChannel(eventsChannel)
      if (attendeesChannel) unsubscribeChannel(attendeesChannel)
    }
  }, [loadEventParticipants, refreshJoinedEvents])

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
    refreshJoinedAnnonces()
  }, [user?.id, refreshJoinedAnnonces])

  React.useEffect(() => {
    if (!user) { setJoinedEventIds(new Set()); return }
    refreshJoinedEvents()
  }, [user?.id, refreshJoinedEvents])

  // Load groups and friends when auth user changes
  React.useEffect(() => {
    if (!user) { setMyGroups([]); setFriends([]); setSocialUnread({ groups: 0, friends: 0, total: 0 }); setInvitations([]); return }
    getAccessibleGroups(user.id)
      .then(all => setMyGroups(all.filter(g => g.isMember)))
      .catch(() => {})
    getFriends(user.id)
      .then(setFriends)
      .catch(() => {})
    getSocialUnreadSummary(user.id)
      .then(setSocialUnread)
      .catch(() => setSocialUnread({ groups: 0, friends: 0, total: 0 }))
    refreshInvitations()
  }, [user?.id])

  React.useEffect(() => {
    if (!user) return
    let channel
    const refreshFriends = () => {
      getFriends(user.id)
        .then(setFriends)
        .catch(() => {})
    }
    try {
      channel = subscribeToFriendships(user.id, refreshFriends)
    } catch {}
    return () => { if (channel) unsubscribe(channel) }
  }, [user?.id])

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    const refreshUnread = () => {
      getSocialUnreadSummary(user.id)
        .then(summary => { if (!cancelled) setSocialUnread(summary) })
        .catch(() => {})
    }
    let channel
    try {
      channel = subscribeToSocialUnreadChanges(user.id, refreshUnread)
    } catch {}
    return () => {
      cancelled = true
      if (channel) unsubscribe(channel)
    }
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
    removeAnnonceEverywhere(annonceId)
    try {
      await svcDeleteAnnonce(annonceId)
      await Promise.all([
        fetchAnnonces().then(data => applyAnnoncesSnapshot(data ?? [])),
        refreshInvitations(),
      ])
    } catch (err) {
      console.error(err)
      fetchAnnonces()
        .then(data => applyAnnoncesSnapshot(data ?? []))
        .catch(() => {})
    }
  }, [applyAnnoncesSnapshot, refreshInvitations, removeAnnonceEverywhere])

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

  const joinEvent = React.useCallback(async (eventId) => {
    if (!user) return

    setBars(prev => updateEventInBars(prev, eventId, event => ({
      ...event,
      attending: event.attending + 1,
    })))
    setJoinedEventIds(prev => new Set([...prev, eventId]))
    setEventParticipantsMap(prev => {
      const list = prev[eventId] ?? []
      if (list.some(participant => participant.user_id === user.id)) return prev

      return {
        ...prev,
        [eventId]: [...list, {
          user_id: user.id,
          name: profile?.name ?? user.user_metadata?.name ?? 'Toi',
          avatar_letter: profile?.avatar_letter ?? (profile?.name?.[0] ?? user.email?.[0] ?? 'T').toUpperCase(),
          avatar_url: profile?.avatar_url ?? null,
          color: profile?.color ?? '#C65D3D',
          joined_at: new Date().toISOString(),
        }],
      }
    })

    try {
      const newCount = await svcJoinEvent(eventId)
      setBars(prev => updateEventInBars(prev, eventId, event => ({
        ...event,
        attending: newCount,
      })))
    } catch {
      setBars(prev => updateEventInBars(prev, eventId, event => ({
        ...event,
        attending: Math.max(0, event.attending - 1),
      })))
      setJoinedEventIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
      setEventParticipantsMap(prev => ({
        ...prev,
        [eventId]: (prev[eventId] ?? []).filter(participant => participant.user_id !== user.id),
      }))
    }
  }, [profile, user])

  const unjoinEvent = React.useCallback(async (eventId) => {
    if (!user) return

    setBars(prev => updateEventInBars(prev, eventId, event => ({
      ...event,
      attending: Math.max(0, event.attending - 1),
    })))
    setJoinedEventIds(prev => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
    setEventParticipantsMap(prev => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).filter(participant => participant.user_id !== user.id),
    }))

    try {
      const newCount = await svcUnjoinEvent(eventId)
      setBars(prev => updateEventInBars(prev, eventId, event => ({
        ...event,
        attending: newCount,
      })))
    } catch {
      setBars(prev => updateEventInBars(prev, eventId, event => ({
        ...event,
        attending: event.attending + 1,
      })))
      setJoinedEventIds(prev => new Set([...prev, eventId]))
      setEventParticipantsMap(prev => {
        const list = prev[eventId] ?? []
        if (list.some(participant => participant.user_id === user.id)) return prev

        return {
          ...prev,
          [eventId]: [...list, {
            user_id: user.id,
            name: profile?.name ?? user.user_metadata?.name ?? 'Toi',
            avatar_letter: profile?.avatar_letter ?? (profile?.name?.[0] ?? user.email?.[0] ?? 'T').toUpperCase(),
            avatar_url: profile?.avatar_url ?? null,
            color: profile?.color ?? '#C65D3D',
            joined_at: new Date().toISOString(),
          }],
        }
      })
    }
  }, [profile, user])

  const notifications = React.useMemo(() => {
    if (!user) return []

    const items = []
    const list = annonces ?? ANNONCES_PUBLIC
    const now = Date.now()

    if (notificationSettings.invitations) {
      invitations
        .filter(inv => list.some(a => a.id === inv.annonce?.id))
        .forEach(inv => {
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
      getBarEvents(bars ?? BARS_DATA)
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

  const agendaEvents = React.useMemo(
    () => getBarEvents(bars ?? BARS_DATA),
    [bars]
  )

  const agendaTags = React.useMemo(
    () => getEventTags(agendaEvents),
    [agendaEvents]
  )

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

  const SERVER_PREF_KEYS = React.useMemo(() => new Set(['messages', 'invitations', 'participants', 'sorties', 'events']), [])

  const updateNotificationSetting = React.useCallback((key, value) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    if (user && SERVER_PREF_KEYS.has(key)) {
      updatePushPreference(user.id, key, value).catch(() => {})
    }
  }, [user?.id, SERVER_PREF_KEYS])

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    getPushPreferences(user.id)
      .then(prefs => {
        if (cancelled || !prefs) return
        setNotificationSettings(prev => ({ ...prev, ...prefs }))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id])

  const requestBrowserNotifications = React.useCallback(async () => {
    if (!user) return { permission: 'unsupported', subscribed: false }
    setWebPushStatus(prev => ({ ...prev, error: '' }))

    try {
      const result = await subscribeUserToPush(user.id)
      const status = await refreshWebPushStatus()
      setNotificationSettings(prev => ({ ...prev, browser: true }))
      return {
        ...status,
        subscriptionId: result.id,
        permission: 'granted',
        subscribed: true,
      }
    } catch (err) {
      const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
      setNotificationPermission(permission)
      setNotificationSettings(prev => ({ ...prev, browser: false }))
      setWebPushStatus(prev => ({
        ...prev,
        permission,
        subscribed: false,
        error: err.message || 'Impossible d activer les notifications push.',
      }))
      return { permission, subscribed: false, error: err.message }
    }
  }, [refreshWebPushStatus, user?.id])

  const disableBrowserNotifications = React.useCallback(async () => {
    if (!user) return
    setWebPushStatus(prev => ({ ...prev, error: '' }))
    try {
      await unsubscribeUserFromPush(user.id)
    } catch (err) {
      setWebPushStatus(prev => ({ ...prev, error: err.message || 'Desactivation push incomplete.' }))
    } finally {
      setNotificationSettings(prev => ({ ...prev, browser: false }))
      refreshWebPushStatus()
    }
  }, [refreshWebPushStatus, user?.id])

  const value = {
    bars: bars ?? BARS_DATA,
    agendaEvents,
    agendaTags,
    annonces: annonces ?? ANNONCES_PUBLIC,
    participantsMap,
    eventParticipantsMap,
    user: userData,
    profile,
    saveProfile,
    joinAnnonce,
    unjoinAnnonce,
    joinEvent,
    unjoinEvent,
    deleteAnnonce,
    addAnnonce,
    joinedAnnonceIds: myJoins,
    joinedEventIds,
    myGroups,
    friends,
    socialUnread,
    invitations,
    notifications,
    unreadNotificationCount,
    notificationSettings,
    notificationPermission,
    webPushStatus,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    updateNotificationSetting,
    requestBrowserNotifications,
    disableBrowserNotifications,
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
