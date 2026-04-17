import React from 'react'
import { USER_DATA } from '../data'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade } from '../components/ui'

// Account / Profile screen

const AccountScreen = ({ onOpenAnnonce }) => {
  const user = USER_DATA;
  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Banner */}
      <div style={{
        height: 160,
        background: 'linear-gradient(135deg, var(--terracotta), var(--ochre))',
        position: 'relative',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
          <defs>
            <pattern id="accountDots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#accountDots)"/>
        </svg>
      </div>

      <div style={{
        margin: '-54px 20px 0', background: 'var(--paper)',
        borderRadius: 20, padding: '18px', position: 'relative',
        boxShadow: '0 -4px 20px rgba(42,31,23,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <Avatar letter={user.avatar} color={user.color} size={76} ring/>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{user.handle}</div>
          </div>
          <button style={{
            background: '#fff', border: '1px solid var(--line)',
            padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>Modifier</button>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          {[
            { n: 12, l: 'Sorties' },
            { n: 4, l: 'Groupes' },
            { n: 28, l: 'Amis' },
          ].map(s => (
            <div key={s.l}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mes annonces */}
      <div style={{ padding: '22px 20px 10px' }}>
        <h2 className="serif" style={{ fontSize: 18, margin: '0 0 10px', fontWeight: 600 }}>Mes annonces</h2>
        {user.annonces.map(a => (
          <div key={a.id} onClick={() => onOpenAnnonce?.(a)}
            style={{
              background: '#fff', borderRadius: 14, padding: 14,
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              borderLeft: '3px solid var(--ochre)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              <Icon name="lock" size={10}/> {a.status}
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-mute)' }}/>
              {a.bar}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{a.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{a.date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
                <Icon name="users" size={13}/> {a.attending} confirmés
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paramètres */}
      <div style={{ padding: '14px 20px 10px' }}>
        <h2 className="serif" style={{ fontSize: 18, margin: '0 0 10px', fontWeight: 600 }}>Paramètres</h2>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          {[
            { icon: 'bell', label: 'Notifications', detail: 'Actives' },
            { icon: 'heart', label: 'Bars favoris', detail: '2' },
            { icon: 'users', label: 'Mes amis', detail: '28' },
            { icon: 'lock', label: 'Confidentialité', detail: '' },
            { icon: 'globe', label: 'Langue', detail: 'Français' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(198,93,61,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={row.icon} size={15} color="var(--terracotta)"/>
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{row.detail}</div>
              <Icon name="chevron" size={14} color="var(--ink-mute)"/>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 20px' }}>
        <button style={{
          width: '100%', background: 'transparent', color: 'var(--ink-mute)',
          border: '1px solid var(--line)', padding: 13, borderRadius: 12,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
        }}>Se déconnecter</button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)', marginTop: 18 }}>
          Bars à Bruz · v1.0 · Fait par Enzo
        </div>
      </div>
    </div>
  );
};

export { AccountScreen };
