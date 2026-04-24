import React from 'react'
import { Avatar, Icon, BarHero } from '../components/ui'
import { useData } from '../context/DataContext'
import { groupEventsByDate } from '../utils/events'
import { useAuth } from '../context/AuthContext'

const EVENT_ICONS = {
  Live: 'music',
  Quiz: 'users',
  Sport: 'flame',
  Dégustation: 'wine',
  Musique: 'music',
  Événement: 'flame',
}

const AgendaScreen = ({ onOpenEvent }) => {
  const { agendaEvents, agendaTags } = useData()
  const [filter, setFilter] = React.useState('all')
  const filteredEvents = filter === 'all'
    ? agendaEvents
    : agendaEvents.filter(event => event.tag === filter)
  const byDate = groupEventsByDate(filteredEvents)

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px 12px' }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>Agenda</div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
          {agendaEvents.length} événements à venir
        </div>
      </div>

      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, overflowX: 'auto' }} className="noscroll">
        {agendaTags.map(tag => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 999,
              background: filter === tag ? 'var(--ink)' : '#fff',
              color: filter === tag ? '#fff' : 'var(--ink-soft)',
              border: filter === tag ? 'none' : '1px solid var(--line)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {tag === 'all' ? 'Tout' : tag}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredEvents.length === 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: 18,
            boxShadow: 'var(--shadow-card)',
          }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Aucune soirée pour ce filtre</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
              Essaie une autre catégorie pour retrouver les prochains événements des bars.
            </div>
          </div>
        )}

        {Object.entries(byDate).map(([date, events]) => (
          <div key={date}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              margin: '0 4px 10px',
            }}>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{date}</div>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                {events.length} évt
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => onOpenEvent(event)}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <div style={{
                    width: 80,
                    background: `linear-gradient(135deg, ${event.bar.color}, ${event.bar.accent})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    padding: 12,
                  }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>
                      {event.time}
                    </div>
                    <Icon name={EVENT_ICONS[event.tag] ?? 'calendar'} size={22} color="#fff" />
                    <div style={{ fontSize: 10, textTransform: 'uppercase', marginTop: 4, opacity: 0.9 }}>
                      {event.tag}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="pin" size={11} />
                      {event.bar.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{event.price}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{event.attending} intéressés</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EventSheet = ({ event, onClose }) => {
  const { user } = useAuth()
  const [attending, setAttending] = React.useState(false)
  const [shareLabel, setShareLabel] = React.useState('Partager à un groupe')
  const attendeePreview = [
    { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#C8B7A6' },
    { id: 'clement', name: 'Clément', avatar: 'C', color: '#B8B2AA' },
    { id: 'lea', name: 'Léa', avatar: 'L', color: '#D8D1C8' },
    { id: 'nassim', name: 'Nassim', avatar: 'N', color: '#CDC3B5' },
    { id: 'rose', name: 'Rose', avatar: 'R', color: '#D7CEC0' },
  ]

  const handleToggleAttending = () => {
    setAttending(value => !value)
  }

  const handleShare = async () => {
    const message = `${event.title} · ${event.date} à ${event.time} chez ${event.bar.name}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: message,
        })
        setShareLabel('Partagé')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message)
        setShareLabel('Lien copié')
      } else {
        setShareLabel('Partage indisponible')
      }
    } catch {
      setShareLabel('Partager à un groupe')
    }
    window.setTimeout(() => {
      setShareLabel('Partager à un groupe')
    }, 1800)
  }

  if (!event) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--paper)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '85%',
          overflow: 'auto',
          animation: 'slideUp 0.25s',
        }}
      >
        <div style={{ height: 260, position: 'relative' }}>
          <BarHero bar={event.bar} height={260} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon name="close" size={16} />
          </button>
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#fff',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: event.bar.color,
            boxShadow: 'var(--shadow-float)',
          }}>
            {String(event.tag).toUpperCase()}
          </div>
        </div>

        <div style={{ padding: '20px 20px 28px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {event.date} · {event.time}
          </div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginTop: 6, lineHeight: 1.2 }}>
            {event.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            À <b>{event.bar.name}</b> · {event.bar.address}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.55 }}>
            {event.description ?? `Retrouve l'ambiance ${String(event.tag).toLowerCase()} de ${event.bar.name} et rejoins la communauté pour une soirée à ${event.time}.`}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 18,
          }}>
            <div style={{ background: '#fff', padding: 14, borderRadius: 14, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Prix</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{event.price}</div>
            </div>
            <div style={{ background: '#fff', padding: 14, borderRadius: 14, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Intéressés</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{event.attending + (attending ? 1 : 0)}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {attendeePreview.map((person, index) => (
                <Avatar
                  key={person.id}
                  letter={person.avatar}
                  color={person.color}
                  size={30}
                  style={{
                    border: '2px solid var(--paper)',
                    marginLeft: index === 0 ? 0 : -10,
                    boxShadow: '0 2px 6px rgba(42,31,23,0.08)',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Sarah, Clément, +{Math.max(0, event.attending - 2)} autres
            </div>
          </div>

          <div style={{
            marginTop: 18,
            background: 'rgba(255,255,255,0.72)',
            borderRadius: 16,
            border: '1px solid rgba(42,31,23,0.08)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Icon name={user ? 'check' : 'bell'} size={16} color={user ? 'var(--success)' : event.bar.color} />
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
              {user
                ? 'Ta participation restera visible dans cette fiche pour suivre la soirée.'
                : 'Connecte-toi plus tard pour retrouver facilement les soirées qui t’intéressent.'}
            </div>
          </div>

          <button
            onClick={handleToggleAttending}
            style={{
              width: '100%',
              marginTop: 22,
              background: attending ? 'var(--success)' : event.bar.color,
              color: '#fff',
              border: 'none',
              padding: 16,
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: attending ? '0 10px 24px rgba(109,143,82,0.22)' : `0 10px 24px ${event.bar.color}33`,
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <Icon name={attending ? 'check' : 'plus'} size={16} color="#fff" />
            {attending ? 'Participation confirmée' : 'Je participe'}
          </button>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              marginTop: 10,
              background: 'transparent',
              color: 'var(--ink-soft)',
              border: '1px solid var(--line)',
              padding: 14,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Icon name="send" size={15} color="currentColor" />
            {shareLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export { AgendaScreen, EventSheet }
