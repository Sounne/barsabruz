import React from 'react'
import { Icon } from './components/ui'
import { useData } from './context/DataContext'
import { HomeScreen, DiscoverScreen, MapView } from './screens/HomeScreen'
import { BarDetailScreen } from './screens/BarDetailScreen'
import { AgendaScreen, EventSheet } from './screens/AgendaScreen'
import { GroupesScreen, GroupChatScreen, NewAnnonceSheet } from './screens/GroupesScreen'
import { AccountScreen } from './screens/AccountScreen'

// Main App — navigation + screens

const App = () => {
  const { bars } = useData()
  const [tab, setTab] = React.useState('home');
  const [barId, setBarId] = React.useState(null);
  const [eventSheet, setEventSheet] = React.useState(null);
  const [groupChat, setGroupChat] = React.useState(null);
  const [newAnnonce, setNewAnnonce] = React.useState(false);

  const navigate = {
    openBar: (id) => setBarId(id),
    openEvent: (e) => setEventSheet(e),
    openGroup: (g) => setGroupChat(g),
    openAnnonce: (a) => {
      const bar = bars.find(b => b.name === a.bar);
      setEventSheet({
        title: a.title,
        date: a.when.split(' ').slice(0, -1).join(' ') || a.when,
        time: a.when.split(' ').pop(),
        price: 'Gratuit',
        tag: 'Annonce',
        attending: a.attending,
        bar,
      });
    },
  };

  // Group chat has full-screen takeover
  if (groupChat) {
    return <GroupChatScreen group={groupChat} onBack={() => setGroupChat(null)}/>;
  }

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
          <GroupesScreen onOpenGroup={navigate.openGroup} onNew={() => setNewAnnonce(true)}/>
        ) : (
          <AccountScreen onOpenAnnonce={navigate.openAnnonce} onOpenBar={navigate.openBar}/>
        )}
      </div>

      {/* Event sheet */}
      {eventSheet && <EventSheet event={eventSheet} onClose={() => setEventSheet(null)}/>}

      {/* New annonce sheet */}
      {newAnnonce && <NewAnnonceSheet onClose={() => setNewAnnonce(false)}/>}

      {/* FAB for new annonce — on home & agenda */}
      {!barId && (tab === 'home' || tab === 'agenda') && !eventSheet && !newAnnonce && (
        <button onClick={() => setNewAnnonce(true)} style={{
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
            { id: 'groupes', label: 'Groupes', icon: 'users' },
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
  );
};

export default App
