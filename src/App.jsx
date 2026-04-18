import React from 'react'
import { Icon } from './components/ui'
import { useData } from './context/DataContext'
import { useAuth } from './context/AuthContext'
import { HomeScreen, DiscoverScreen, MapView } from './screens/HomeScreen'
import { BarDetailScreen } from './screens/BarDetailScreen'
import { AgendaScreen, EventSheet } from './screens/AgendaScreen'
import { GroupesScreen, GroupChatScreen, DMChatScreen, NewAnnonceSheet, NewSortieSheet } from './screens/GroupesScreen'
import { AccountScreen } from './screens/AccountScreen'
import { AuthScreen } from './screens/AuthScreen'

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

// ─────────── MAIN APP ───────────
const App = () => {
  const { session, loading: authLoading } = useAuth()
  const { bars } = useData()
  const [tab, setTab] = React.useState('home')
  const [barId, setBarId] = React.useState(null)
  const [eventSheet, setEventSheet] = React.useState(null)
  const [groupChat, setGroupChat] = React.useState(null)
  const [dmChat, setDmChat] = React.useState(null)
  const [newAnnonce, setNewAnnonce] = React.useState(false)
  const [newSortie, setNewSortie] = React.useState(false)
  const [groupsRefreshKey, setGroupsRefreshKey] = React.useState(0)

  if (authLoading) return <LoadingSplash/>

  const navigate = {
    openBar: (id) => setBarId(id),
    openEvent: (e) => setEventSheet(e),
    openGroup: (g) => setGroupChat(g),
    openDM: (friend) => setDmChat(friend),
    openAnnonce: (a) => {
      const bar = bars.find(b => b.name === a.bar)
      setEventSheet({
        title: a.title,
        date: a.when.split(' ').slice(0, -1).join(' ') || a.when,
        time: a.when.split(' ').pop(),
        price: 'Gratuit',
        tag: 'Annonce',
        attending: a.attending,
        bar,
      })
    },
  }

  if (groupChat) return <GroupChatScreen group={groupChat} onBack={() => setGroupChat(null)} onDelete={() => { setGroupChat(null); setGroupsRefreshKey(k => k + 1) }}/>
  if (dmChat) return <DMChatScreen friend={dmChat} onBack={() => setDmChat(null)}/>

  return (
    <>
      {/* Screen */}
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 46 }} className="noscroll">
        {barId ? (
          <BarDetailScreen barId={barId} onBack={() => setBarId(null)} onOpenEvent={navigate.openEvent} onNewAnnonce={() => setNewAnnonce(true)}/>
        ) : tab === 'home' ? (
          <HomeScreen {...{
            onOpenBar: navigate.openBar,
            onOpenEvent: navigate.openEvent,
            onOpenAnnonce: navigate.openAnnonce,
            onNavigateTab: setTab,
          }}/>
        ) : tab === 'discover' ? (
          <DiscoverScreen onOpenBar={navigate.openBar}/>
        ) : tab === 'agenda' ? (
          <AgendaScreen onOpenEvent={navigate.openEvent}/>
        ) : tab === 'groupes' ? (
          <GroupesScreen onOpenGroup={navigate.openGroup} onOpenDM={navigate.openDM} onNew={() => setNewAnnonce(true)} refreshKey={groupsRefreshKey}/>
        ) : session ? (
          <AccountScreen onOpenAnnonce={navigate.openAnnonce} onOpenBar={navigate.openBar}/>
        ) : (
          <AuthScreen/>
        )}
      </div>

      {/* Event sheet */}
      {eventSheet && <EventSheet event={eventSheet} onClose={() => setEventSheet(null)}/>}

      {/* New group sheet */}
      {newAnnonce && <NewAnnonceSheet onClose={() => setNewAnnonce(false)} onGroupCreated={() => setGroupsRefreshKey(k => k + 1)}/>}

      {/* New sortie sheet */}
      {newSortie && <NewSortieSheet onClose={() => setNewSortie(false)}/>}

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
          padding: '8px 8px 28px',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
        }}>
          {[
            { id: 'home', label: 'Accueil', icon: 'home' },
            { id: 'discover', label: 'Bars', icon: 'pin' },
            { id: 'agenda', label: 'Agenda', icon: 'calendar' },
            { id: 'groupes', label: 'Social', icon: 'users' },
            { id: 'account', label: 'Compte', icon: 'user' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', padding: '8px 0 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              <Icon name={t.icon} size={22} color={tab === t.id ? 'var(--terracotta)' : 'var(--ink-mute)'} stroke={tab === t.id ? 2.2 : 1.7}/>
              <span style={{
                fontSize: 10, fontWeight: tab === t.id ? 600 : 500,
                color: tab === t.id ? 'var(--terracotta)' : 'var(--ink-mute)',
              }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default App
