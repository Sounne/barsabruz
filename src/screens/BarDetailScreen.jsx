import React from 'react'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade } from '../components/ui'
import { getBarStatus, useCurrentTime } from '../utils/barStatus'
import { useData } from '../context/DataContext'

// Bar detail screen

const BarDetailScreen = ({ barId, onBack, onOpenEvent, onNewAnnonce }) => {
  const { bars } = useData()
  const bar = bars.find(b => b.id === barId);
  const [fav, setFav] = React.useState(false);
  const now = useCurrentTime();
  const status = getBarStatus(bar, now);
  const days = [
    ['Lundi', 'Mon'], ['Mardi', 'Tue'], ['Mercredi', 'Wed'],
    ['Jeudi', 'Thu'], ['Vendredi', 'Fri'], ['Samedi', 'Sat'], ['Dimanche', 'Sun']
  ];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [hoursOpen, setHoursOpen] = React.useState(false);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <BarHero bar={bar} height={260} />
        <button onClick={onBack} style={{
          position: 'absolute', top: 54, left: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
        }}>
          <Icon name="back" size={20} color="var(--ink)"/>
        </button>
        <div style={{
          position: 'absolute', top: 54, right: 16, display: 'flex', gap: 8,
        }}>
          <button onClick={() => setFav(!fav)} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: fav ? 'var(--terracotta)' : 'rgba(255,255,255,0.95)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            <Icon name="heart" size={18} color={fav ? '#fff' : 'var(--ink)'}/>
          </button>
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: 'var(--paper)', margin: '-24px 16px 0',
        borderRadius: 20, padding: '18px 18px 8px',
        position: 'relative', zIndex: 2,
        boxShadow: '0 -4px 20px rgba(42,31,23,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <OpenDot open={status.openNow}/>
          <span style={{ fontSize: 12, fontWeight: 600, color: status.openNow ? 'var(--success)' : 'var(--ink-mute)' }}>
            {status.openNow ? `Ouvert · ferme dans ${status.closesIn}` : status.opensIn}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-mute)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            <Icon name="star" size={12} color="var(--ochre-deep)"/> {bar.rating} ({bar.reviews})
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 'auto' }}>{bar.priceLevel}</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.5 }}>
          {bar.description}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {bar.tags.map(t => <Tag key={t} color={bar.color} bg={`${bar.color}15`}>{t}</Tag>)}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '18px 16px 8px', display: 'flex', gap: 10 }}>
        <button onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(bar.address), '_blank')} style={{
          flex: 1, background: bar.color, color: '#fff', border: 'none',
          padding: '13px', borderRadius: 14, fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <Icon name="pin" size={16} color="#fff"/> Itinéraire
        </button>
        <button onClick={onNewAnnonce} style={{
          flex: 1, background: '#fff', color: 'var(--ink)',
          border: '1px solid var(--line)',
          padding: '13px', borderRadius: 14, fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <Icon name="plus" size={16}/> Proposer une soirée
        </button>
      </div>

      {/* Horaires */}
      <div style={{ padding: '14px 16px 0' }}>
        <div onClick={() => setHoursOpen(!hoursOpen)} style={{
          background: '#fff', borderRadius: 16, padding: 14,
          boxShadow: 'var(--shadow-card)', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="clock" size={18} color={bar.color}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Horaires</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>
                Aujourd'hui · {bar.hours[days[todayIdx][1]] || 'Fermé'}
              </div>
            </div>
            <Icon name={hoursOpen ? 'chevronD' : 'chevron'} size={16} color="var(--ink-mute)"/>
          </div>
          {hoursOpen && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              {days.map(([label, key], i) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', fontSize: 13,
                  fontWeight: i === todayIdx ? 600 : 400,
                  color: i === todayIdx ? 'var(--ink)' : 'var(--ink-soft)',
                }}>
                  <span>{label}</span>
                  <span style={{ color: bar.hours[key] ? 'inherit' : 'var(--ink-mute)' }}>
                    {bar.hours[key] || 'Fermé'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adresse + Contacts */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 16,
          boxShadow: 'var(--shadow-card)', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: '1px solid var(--line)' }}>
            <Icon name="pin" size={18} color={bar.color}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Adresse</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{bar.address}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>À {bar.distance}</div>
            </div>
          </div>
          {bar.phone && (
            <a href={`tel:${bar.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14,
              borderBottom: bar.website ? '1px solid var(--line)' : 'none',
              textDecoration: 'none', color: 'inherit',
            }}>
              <Icon name="phone" size={18} color={bar.color}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Téléphone</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{bar.phone}</div>
              </div>
              <Icon name="chevron" size={14} color="var(--ink-mute)"/>
            </a>
          )}
          {bar.website && (
            <a href={bar.website} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14,
              textDecoration: 'none', color: 'inherit',
            }}>
              <Icon name="globe" size={18} color={bar.color}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Site web</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{bar.website.replace('https://', '')}</div>
              </div>
              <Icon name="chevron" size={14} color="var(--ink-mute)"/>
            </a>
          )}
        </div>
      </div>

      {/* Spécialités */}
      <div style={{ padding: '22px 16px 8px' }}>
        <h2 className="serif" style={{ fontSize: 18, margin: '0 4px 10px', fontWeight: 600 }}>Spécialités</h2>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }} className="noscroll">
          {bar.specialties.map((s, i) => (
            <div key={i} style={{
              flexShrink: 0, padding: '10px 16px', borderRadius: 999,
              background: `${bar.color}12`, color: bar.color,
              fontSize: 13, fontWeight: 600,
            }}>{s}</div>
          ))}
        </div>
      </div>

      {/* Événements */}
      <div style={{ padding: '22px 16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 4px 10px' }}>
          <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Prochains événements</h2>
          <span style={{ fontSize: 12, color: bar.color, fontWeight: 600 }}>Voir tout</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bar.events.map(ev => (
            <div key={ev.id} onClick={() => onOpenEvent({...ev, bar})}
              style={{
                background: '#fff', borderRadius: 14, padding: 12,
                display: 'flex', gap: 12, alignItems: 'stretch',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              }}>
              <div style={{
                width: 4, borderRadius: 3, background: bar.color, flexShrink: 0,
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Icon name="calendar" size={12}/>
                  {ev.date} · {ev.time}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{ev.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <Tag size="sm" color={bar.color} bg={`${bar.color}15`}>{ev.tag}</Tag>
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>· {ev.price}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 'auto' }}>
                    {ev.attending} intéressés
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { BarDetailScreen };
