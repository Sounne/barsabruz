import React, { Suspense } from 'react'
import { Icon, Avatar } from './components/ui'
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

// ─────────── MAIN APP ───────────
const App = () => {
  const { session, loading: authLoading } = useAuth()
  const { bars, annonces, participantsMap, joinAnnonce, unjoinAnnonce, deleteAnnonce, joinedAnnonceIds, user, unreadNotificationCount, socialUnread } = useData()
  const isLoggedIn = !!session?.user
  const [tab, setTab] = React.useState('home')
  const [socialTab, setSocialTab] = React.useState('groupes')
  const [slideDir, setSlideDir] = React.useState(null)
  const [barId, setBarId] = React.useState(null)
  const [eventSheet, setEventSheet] = React.useState(null)
  const [groupChat, setGroupChat] = React.useState(null)
  const [dmChat, setDmChat] = React.useState(null)
  const [newAnnonce, setNewAnnonce] = React.useState(false)
  const [newSortie, setNewSortie] = React.useState(false)
  const [groupsRefreshKey, setGroupsRefreshKey] = React.useState(0)
  const [sortieSheet, setSortieSheet] = React.useState(null)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)

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

  if (authLoading) return <LoadingSplash/>

  const navigate = {
    openBar: (id) => setBarId(id),
    openEvent: (e) => setEventSheet(e),
    openGroup: (g) => setGroupChat(g),
    openDM: (friend) => setDmChat(friend),
    openFriends: () => {
      setSocialTab('amis')
      handleTabChange('groupes')
    },
    openAnnonce: (a) => setSortieSheet(a),
    openNotifications: () => {
      if (!isLoggedIn) return
      setNotificationsOpen(true)
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

  if (groupChat) {
    return (
      <DeferredScreen>
        <GroupChatScreen
          group={groupChat}
          onBack={() => setGroupChat(null)}
          onDelete={() => { setGroupChat(null); setGroupsRefreshKey(k => k + 1) }}
        />
      </DeferredScreen>
    )
  }

  if (dmChat) {
    return (
      <DeferredScreen>
        <DMChatScreen friend={dmChat} onBack={() => setDmChat(null)} />
      </DeferredScreen>
    )
  }

  return (
    <>
      {/* Screen */}
      <div
        key={tab}
        className={`noscroll${slideDir ? ` tab-slide-${slideDir}` : ''}`}
        style={{ height: '100%', overflow: 'auto', paddingTop: 46 }}
      >
        {barId ? (
          <DeferredScreen>
            <BarDetailScreen barId={barId} onBack={() => setBarId(null)} onOpenEvent={navigate.openEvent} onNewAnnonce={() => setNewAnnonce(true)}/>
          </DeferredScreen>
        ) : tab === 'home' ? (
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
              onOpenNotifications={navigate.openNotifications}
              onOpenFriends={navigate.openFriends}
            />
          </DeferredScreen>
        ) : (
          <DeferredScreen>
            <AuthScreen/>
          </DeferredScreen>
        )}
      </div>

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
