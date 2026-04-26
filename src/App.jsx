import React, { Suspense } from 'react'
import { Icon, Avatar } from './components/ui'
import { Sheet } from './components/Sheet'
import { useData } from './context/DataContext'
import { useAuth } from './context/AuthContext'
import { HomeScreen, DiscoverScreen, MapView, SortieDetailSheet } from './screens/HomeScreen'

const BarDetailScreen = React.lazy(() =>
  import('./screens/BarDetailScreen').then((module) => ({ default: module.BarDetailScreen })),
)

const AgendaScreen = React.lazy(() =>
  import('./screens/AgendaScreen').then((module) => ({ default: module.AgendaScreen })),
)

const EventSheet = React.lazy(() =>
  import('./screens/AgendaScreen').then((module) => ({ default: module.EventSheet })),
)

const GroupesScreen = React.lazy(() =>
  import('./screens/GroupesScreen').then((module) => ({ default: module.GroupesScreen })),
)

const GroupChatScreen = React.lazy(() =>
  import('./screens/GroupesScreen').then((module) => ({ default: module.GroupChatScreen })),
)

const DMChatScreen = React.lazy(() =>
  import('./screens/GroupesScreen').then((module) => ({ default: module.DMChatScreen })),
)

const NewAnnonceSheet = React.lazy(() =>
  import('./screens/GroupesScreen').then((module) => ({ default: module.NewAnnonceSheet })),
)

const NewSortieSheet = React.lazy(() =>
  import('./screens/GroupesScreen').then((module) => ({ default: module.NewSortieSheet })),
)

const AccountScreen = React.lazy(() =>
  import('./screens/AccountScreen').then((module) => ({ default: module.AccountScreen })),
)

const AuthScreen = React.lazy(() =>
  import('./screens/AuthScreen').then((module) => ({ default: module.AuthScreen })),
)

const NotificationsSheet = React.lazy(() =>
  import('./screens/NotificationsSheet').then((module) => ({ default: module.NotificationsSheet })),
)

const NotificationSettingsSheet = React.lazy(() =>
  import('./screens/NotificationsSheet').then((module) => ({ default: module.NotificationSettingsSheet })),
)

// ─────────── LOADING SPLASH ───────────
const LoadingSplash = () => (
  <div style={{
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--paper)', gap: 14,
  }}>
    <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: 'var(--terracotta)' }}>
      Bars à Bruz
    </div>
    <div style={{ width: 36, height: 3, borderRadius: 99, background: 'var(--line-strong)', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--terracotta)',
        animation: 'loadingBar 1.2s ease-in-out infinite',
      }}/>
    </div>
  </div>
)

const DeferredScreen = ({ children }) => (
  <Suspense fallback={<LoadingSplash />}>
    {children}
  </Suspense>
)

const TABS = ['home', 'discover', 'agenda', 'groupes', 'account']
const PULL_REFRESH_THRESHOLD = 82
const PULL_REFRESH_MAX = 122

// ─────────── MAIN APP ───────────
const App = () => {
  const { session, loading: authLoading } = useAuth()
  const { bars, annonces, participantsMap, joinAnnonce, unjoinAnnonce, deleteAnnonce, joinedAnnonceIds, user, unreadNotificationCount, socialUnread, refreshData } = useData()
  const isLoggedIn = !!session?.user
  const [tab, setTab] = React.useState('home')
  const [socialTab, setSocialTab] = React.useState('groupes')
  const [slideDir, setSlideDir] = React.useState(null)
  const [barId, setBarId] = React.useState(null)
  const [barSheetClosing, setBarSheetClosing] = React.useState(false)
  const [eventSheet, setEventSheet] = React.useState(null)
  const [groupChat, setGroupChat] = React.useState(null)
  const [groupChatClosing, setGroupChatClosing] = React.useState(false)
  const [dmChat, setDmChat] = React.useState(null)
  const [dmChatClosing, setDmChatClosing] = React.useState(false)
  const [newAnnonce, setNewAnnonce] = React.useState(false)
  const [newSortie, setNewSortie] = React.useState(false)
  const [groupsRefreshKey, setGroupsRefreshKey] = React.useState(0)
  const [sortieSheet, setSortieSheet] = React.useState(null)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [notificationSettingsOpen, setNotificationSettingsOpen] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [pullRefreshing, setPullRefreshing] = React.useState(false)
  const pullStartY = React.useRef(null)
  const scrollRef = React.useRef(null)

  const pullProgress = Math.min(1, pullDistance / PULL_REFRESH_THRESHOLD)
  const pullArmed = pullDistance >= PULL_REFRESH_THRESHOLD

  const finishPullRefresh = React.useCallback(async () => {
    setPullRefreshing(true)
    setPullDistance(PULL_REFRESH_THRESHOLD)
    try {
      await refreshData()
      setGroupsRefreshKey(k => k + 1)
    } catch (err) {
      console.warn('Refresh indisponible:', err.message)
    } finally {
      window.setTimeout(() => {
        setPullRefreshing(false)
        setPullDistance(0)
      }, 360)
    }
  }, [refreshData])

  const handleTouchStart = (event) => {
    if (pullRefreshing || scrollRef.current?.scrollTop > 0) return
    pullStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchMove = (event) => {
    if (pullRefreshing || pullStartY.current == null || scrollRef.current?.scrollTop > 0) return
    const currentY = event.touches[0]?.clientY ?? pullStartY.current
    const delta = currentY - pullStartY.current

    if (delta <= 0) {
      setPullDistance(0)
      return
    }

    if (event.cancelable) event.preventDefault()
    const resisted = Math.min(PULL_REFRESH_MAX, Math.pow(delta, 0.82) * 1.35)
    setPullDistance(resisted)
  }

  const handleTouchEnd = () => {
    pullStartY.current = null
    if (pullRefreshing) return
    if (pullDistance >= PULL_REFRESH_THRESHOLD) {
      finishPullRefresh()
      return
    }
    setPullDistance(0)
  }

  React.useEffect(() => {
    if (!sortieSheet) return
    const current = annonces.find(a => a.id === sortieSheet.id)
    if (!current) {
      setSortieSheet(null)
      return
    }
    setSortieSheet(current)
  }, [annonces, sortieSheet?.id])

  const handleTabChange = (newTab) => {
    if (newTab === tab) return
    const oldIdx = TABS.indexOf(tab)
    const newIdx = TABS.indexOf(newTab)
    setSlideDir(newIdx > oldIdx ? 'right' : 'left')
    setTab(newTab)
  }

  const openBarSheet = React.useCallback((id) => {
    setBarSheetClosing(false)
    setBarId(id)
  }, [])

  const closeBarSheet = React.useCallback(() => {
    setBarSheetClosing(true)
  }, [])

  const clearBarSheet = React.useCallback(() => {
    setBarId(null)
    setBarSheetClosing(false)
  }, [])

  const openGroupChat = React.useCallback((group) => {
    setGroupChatClosing(false)
    setGroupChat(group)
  }, [])

  const closeGroupChat = React.useCallback(() => {
    setGroupChatClosing(true)
  }, [])

  const clearGroupChat = React.useCallback(() => {
    setGroupChat(null)
    setGroupChatClosing(false)
  }, [])

  const openDMChat = React.useCallback((friend) => {
    setDmChatClosing(false)
    setDmChat(friend)
  }, [])

  const closeDMChat = React.useCallback(() => {
    setDmChatClosing(true)
  }, [])

  const clearDMChat = React.useCallback(() => {
    setDmChat(null)
    setDmChatClosing(false)
  }, [])

  if (authLoading) return <LoadingSplash/>

  const navigate = {
    openBar: openBarSheet,
    openEvent: (e) => setEventSheet(e),
    openGroup: openGroupChat,
    openDM: openDMChat,
    openFriends: () => {
      setSocialTab('amis')
      handleTabChange('groupes')
    },
    openAnnonce: (a) => setSortieSheet(a),
    openNotifications: () => {
      if (!isLoggedIn) return
      setNotificationsOpen(true)
    },
    openNotificationSettings: () => {
      if (!isLoggedIn) return
      setNotificationSettingsOpen(true)
    },
  }

  const handleSortieJoin = () => {
    if (!sortieSheet) return
    joinAnnonce(sortieSheet.id, sortieSheet.attending)
    setSortieSheet(prev => prev ? { ...prev, attending: prev.attending + 1 } : prev)
  }

  const handleSortieUnjoin = () => {
    if (!sortieSheet) return
    unjoinAnnonce(sortieSheet.id)
    setSortieSheet(prev => prev ? { ...prev, attending: Math.max(0, prev.attending - 1) } : prev)
  }

  const handleSortieDelete = () => {
    if (!sortieSheet) return
    deleteAnnonce(sortieSheet.id)
    setSortieSheet(null)
  }

  return (
    <>
      {/* Screen */}
      <div
        ref={scrollRef}
        key={tab}
        className={`noscroll${slideDir ? ` tab-slide-${slideDir}` : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          height: '100%',
          overflow: 'auto',
          paddingTop: 46,
          transform: `translateY(${pullDistance * 0.42}px)`,
          transition: pullDistance === 0 || pullRefreshing ? 'transform 0.22s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {tab === 'home' ? (
          <HomeScreen {...{
            onOpenBar: navigate.openBar,
            onOpenEvent: navigate.openEvent,
            onOpenAnnonce: navigate.openAnnonce,
            onNewSortie: () => setNewSortie(true),
            onNavigateTab: handleTabChange,
            onOpenNotifications: navigate.openNotifications,
          }}/>
        ) : tab === 'discover' ? (
          <DiscoverScreen onOpenBar={navigate.openBar}/>
        ) : tab === 'agenda' ? (
          <DeferredScreen>
            <AgendaScreen onOpenEvent={navigate.openEvent}/>
          </DeferredScreen>
        ) : tab === 'groupes' ? (
          <DeferredScreen>
            <GroupesScreen
              onOpenGroup={navigate.openGroup}
              onOpenDM={navigate.openDM}
              onNew={() => setNewAnnonce(true)}
              refreshKey={groupsRefreshKey}
              initialTab={socialTab}
              onTabChange={setSocialTab}
            />
          </DeferredScreen>
        ) : session ? (
          <DeferredScreen>
            <AccountScreen
              onOpenAnnonce={navigate.openAnnonce}
              onOpenNotificationSettings={navigate.openNotificationSettings}
              onOpenFriends={navigate.openFriends}
            />
          </DeferredScreen>
        ) : (
          <DeferredScreen>
            <AuthScreen/>
          </DeferredScreen>
        )}
      </div>

      {barId && (
        <Sheet
          className="bar-detail-sheet"
          label="Détail du bar"
          closing={barSheetClosing}
          onClose={closeBarSheet}
          onExited={clearBarSheet}
        >
          <DeferredScreen>
            <BarDetailScreen
              barId={barId}
              onBack={closeBarSheet}
              onOpenEvent={navigate.openEvent}
              onNewAnnonce={() => setNewAnnonce(true)}
            />
          </DeferredScreen>
        </Sheet>
      )}

      {groupChat && (
        <Sheet
          className="chat-sheet"
          label={`Groupe ${groupChat.name}`}
          closing={groupChatClosing}
          onClose={closeGroupChat}
          onExited={clearGroupChat}
          panelStyle={{ overflow: 'hidden' }}
          zIndex={150}
        >
          <DeferredScreen>
            <GroupChatScreen
              group={groupChat}
              onBack={closeGroupChat}
              onDelete={() => setGroupsRefreshKey(k => k + 1)}
            />
          </DeferredScreen>
        </Sheet>
      )}

      {dmChat && (
        <Sheet
          className="chat-sheet"
          label={`Conversation avec ${dmChat.name}`}
          closing={dmChatClosing}
          onClose={closeDMChat}
          onExited={clearDMChat}
          panelStyle={{ overflow: 'hidden' }}
          zIndex={150}
        >
          <DeferredScreen>
            <DMChatScreen friend={dmChat} onBack={closeDMChat} />
          </DeferredScreen>
        </Sheet>
      )}

      {(pullDistance > 0 || pullRefreshing) && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 12 + Math.min(34, pullDistance * 0.22),
            left: '50%',
            zIndex: 80,
            width: 42,
            height: 42,
            borderRadius: '50%',
            transform: `translateX(-50%) scale(${0.74 + pullProgress * 0.26})`,
            opacity: Math.min(1, 0.22 + pullProgress),
            background: 'rgba(250,244,232,0.96)',
            border: `1px solid ${pullArmed || pullRefreshing ? 'rgba(198,93,61,0.42)' : 'var(--line)'}`,
            boxShadow: '0 8px 22px rgba(42,31,23,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transition: pullRefreshing ? 'top 0.18s, transform 0.18s, opacity 0.18s' : 'none',
          }}
        >
          <span
            className={pullRefreshing ? 'pull-refresh-spin' : ''}
            style={{
              display: 'inline-flex',
              transform: pullRefreshing ? undefined : `rotate(${pullProgress * 180}deg)`,
              transition: pullArmed ? 'transform 0.14s ease' : 'none',
            }}
          >
            <Icon
              name={pullArmed || pullRefreshing ? 'refresh' : 'chevronD'}
              size={22}
              color={pullArmed || pullRefreshing ? 'var(--terracotta)' : 'var(--ink-mute)'}
              stroke={2}
            />
          </span>
        </div>
      )}

      {/* Event sheet */}
      {eventSheet && (
        <DeferredScreen>
          <EventSheet event={eventSheet} onClose={() => setEventSheet(null)}/>
        </DeferredScreen>
      )}

      {isLoggedIn && notificationsOpen && (
        <DeferredScreen>
          <NotificationsSheet
            onClose={() => setNotificationsOpen(false)}
            onOpenAnnonce={(annonce) => {
              setNotificationsOpen(false)
              navigate.openAnnonce(annonce)
            }}
            onOpenEvent={(event) => {
              setNotificationsOpen(false)
              navigate.openEvent(event)
            }}
          />
        </DeferredScreen>
      )}

      {isLoggedIn && notificationSettingsOpen && (
        <DeferredScreen>
          <NotificationSettingsSheet onClose={() => setNotificationSettingsOpen(false)} />
        </DeferredScreen>
      )}

      {/* Sortie detail sheet (annonces from account) */}
      {sortieSheet && (
        <SortieDetailSheet
          annonce={sortieSheet}
          participants={participantsMap[sortieSheet.id] ?? []}
          joined={joinedAnnonceIds.has(sortieSheet.id)}
          isCreator={!!(session?.user && sortieSheet.user_id === session.user.id)}
          authUser={session?.user ?? null}
          onJoin={handleSortieJoin}
          onUnjoin={handleSortieUnjoin}
          onDelete={handleSortieDelete}
          onClose={() => setSortieSheet(null)}
        />
      )}

      {/* New group sheet */}
      {newAnnonce && (
        <DeferredScreen>
          <NewAnnonceSheet onClose={() => setNewAnnonce(false)} onGroupCreated={() => setGroupsRefreshKey(k => k + 1)}/>
        </DeferredScreen>
      )}

      {/* New sortie sheet */}
      {newSortie && (
        <DeferredScreen>
          <NewSortieSheet onClose={() => setNewSortie(false)} onCreated={() => setNewSortie(false)}/>
        </DeferredScreen>
      )}

      {/* FAB for new sortie — on home */}
      {!barId && tab === 'home' && !eventSheet && !newSortie && !newAnnonce && (
        <button onClick={() => setNewSortie(true)} style={{
          position: 'absolute', bottom: 100, right: 20, zIndex: 50,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--terracotta)', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(198,93,61,0.4)',
          cursor: 'pointer',
        }}>
          <Icon name="plus" size={26} color="#fff"/>
        </button>
      )}

      {/* Tab bar */}
      {!barId && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(250,244,232,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--line)',
        }}>
          {/* Sliding top indicator */}
          <div style={{
            position: 'absolute', top: 0,
            left: `${TABS.indexOf(tab) * 20}%`,
            width: '20%', height: 2.5,
            background: 'var(--terracotta)',
            borderRadius: '0 0 3px 3px',
            transition: 'left 0.26s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
          }}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, padding: '8px 8px 28px' }}>
            {[
              { id: 'home', label: 'Accueil', icon: 'home' },
              { id: 'discover', label: 'Bars', icon: 'pin' },
              { id: 'agenda', label: 'Agenda', icon: 'calendar' },
              { id: 'groupes', label: 'Social', icon: 'users' },
              { id: 'account', label: 'Compte', icon: 'user' },
            ].map(t => (
              <button key={t.id} onClick={() => handleTabChange(t.id)}
                style={{
                  background: 'none', border: 'none', padding: '8px 0 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transform: tab === t.id ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}>
                {t.id === 'account' ? (
                  <span style={{ position: 'relative' }}>
                    {isLoggedIn ? (
                      <Avatar
                        letter={user.avatar}
                        src={user.avatarUrl}
                        color={user.color}
                        size={22}
                        style={{
                          outline: tab === 'account' ? '2px solid var(--terracotta)' : '2px solid transparent',
                          outlineOffset: 1,
                          transition: 'outline-color 0.2s',
                        }}
                      />
                    ) : (
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: tab === 'account' ? 'rgba(198,93,61,0.14)' : 'rgba(42,31,23,0.08)',
                        border: tab === 'account' ? '1.5px solid rgba(198,93,61,0.34)' : '1.5px solid rgba(42,31,23,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}>
                        <Icon
                          name="user"
                          size={13}
                          color={tab === 'account' ? 'var(--terracotta)' : 'var(--ink-mute)'}
                          stroke={2}
                        />
                      </span>
                    )}
                    {isLoggedIn && unreadNotificationCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -5,
                        right: -7,
                        minWidth: 15,
                        height: 15,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: 'var(--terracotta)',
                        color: '#fff',
                        border: '2px solid var(--paper)',
                        fontSize: 8,
                        fontWeight: 800,
                        lineHeight: '11px',
                        textAlign: 'center',
                      }}>{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
                    )}
                  </span>
                ) : (
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <Icon name={t.icon} size={22} color={tab === t.id ? 'var(--terracotta)' : 'var(--ink-mute)'} stroke={tab === t.id ? 2.2 : 1.7}/>
                    {isLoggedIn && t.id === 'groupes' && socialUnread?.total > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -6,
                        right: -8,
                        minWidth: 15,
                        height: 15,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: 'var(--terracotta)',
                        color: '#fff',
                        border: '2px solid var(--paper)',
                        fontSize: 8,
                        fontWeight: 800,
                        lineHeight: '11px',
                        textAlign: 'center',
                      }}>{socialUnread.total > 9 ? '9+' : socialUnread.total}</span>
                    )}
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: tab === t.id ? 600 : 500,
                  color: tab === t.id ? 'var(--terracotta)' : 'var(--ink-mute)',
                  transition: 'color 0.2s, font-weight 0.2s',
                }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default App
