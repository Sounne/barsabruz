import React from 'react'
import { BARS_DATA } from '../data'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade } from '../components/ui'

// Événements (agenda), Annonces, Groupes, Compte

// ═══════════════ AGENDA ═══════════════
const AgendaScreen = ({ onOpenEvent }) => {
  const bars = BARS_DATA;
  // Flatten and group by date
  const all = bars.flatMap(b => b.events.map(e => ({...e, bar: b})));
  const byDate = {};
  all.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
  const [filter, setFilter] = React.useState('all');
  const tags = ['all', 'Live', 'Quiz', 'Sport', 'Dégustation', 'Musique'];

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px 12px' }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>Agenda</div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
          {all.length} événements à venir
        </div>
      </div>
      {/* Filter chips */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, overflowX: 'auto' }} className="noscroll">
        {tags.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 999,
              background: filter === t ? 'var(--ink)' : '#fff',
              color: filter === t ? '#fff' : 'var(--ink-soft)',
              border: filter === t ? 'none' : '1px solid var(--line)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            }}>
            {t === 'all' ? 'Tout' : t}
          </button>
        ))}
      </div>

      {/* Groups by date */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(byDate).map(([date, evs]) => {
          const filtered = filter === 'all' ? evs : evs.filter(e => e.tag === filter);
          if (filtered.length === 0) return null;
          return (
            <div key={date}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                margin: '0 4px 10px',
              }}>
                <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{date}</div>
                <div style={{
                  flex: 1, height: 1, background: 'var(--line)',
                }}/>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  {filtered.length} évt
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(ev => (
                  <div key={ev.id} onClick={() => onOpenEvent(ev)}
                    style={{
                      background: '#fff', borderRadius: 14, overflow: 'hidden',
                      boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                      display: 'flex',
                    }}>
                    <div style={{
                      width: 80, background: `linear-gradient(135deg, ${ev.bar.color}, ${ev.bar.accent})`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', padding: 12,
                    }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>
                        {ev.time}
                      </div>
                      <Icon name={{Live:'music',Quiz:'users',Sport:'flame',Dégustation:'wine',Musique:'music',Événement:'flame'}[ev.tag]} size={22} color="#fff"/>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', marginTop: 4, opacity: 0.9 }}>
                        {ev.tag}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="pin" size={11}/> {ev.bar.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{ev.price}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{ev.attending} intéressés</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════ EVENT DETAIL (sheet) ═══════════════
const EventSheet = ({ event, onClose }) => {
  const [attending, setAttending] = React.useState(false);
  if (!event) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.2s',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: '100%', background: 'var(--paper)',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          maxHeight: '85%', overflow: 'auto',
          animation: 'slideUp 0.25s',
        }}>
        <div style={{ height: 260, position: 'relative' }}>
          <BarHero bar={event.bar} height={260}/>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Icon name="close" size={16}/>
          </button>
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(255,255,255,0.95)',
            padding: '6px 12px', borderRadius: 999,
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: event.bar.color,
          }}>{event.tag}</div>
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
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
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

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex' }}>
              {['#C65D3D','#6B3A4A','#D9A44A','#6D7A3D','#7FA7B8'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: '2px solid var(--paper)',
                  marginLeft: i === 0 ? 0 : -10,
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Sarah, Clément, +{event.attending - 2} autres
            </div>
          </div>

          <button onClick={() => setAttending(!attending)} style={{
            width: '100%', marginTop: 22,
            background: attending ? 'var(--success)' : event.bar.color,
            color: '#fff', border: 'none',
            padding: 16, borderRadius: 14,
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {attending ? <><Icon name="check" size={18} color="#fff"/> Tu y es !</> : 'Je participe'}
          </button>
          <button style={{
            width: '100%', marginTop: 10,
            background: 'transparent', color: 'var(--ink-soft)',
            border: '1px solid var(--line)',
            padding: 14, borderRadius: 14,
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            cursor: 'pointer',
          }}>Partager à un groupe</button>
        </div>
      </div>
    </div>
  );
};

export { AgendaScreen, EventSheet };
