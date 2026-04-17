import React from 'react'
import { BARS_DATA, ANNONCES_PUBLIC } from '../data'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade } from '../components/ui'
import { getBarStatus, useCurrentTime } from '../utils/barStatus'

// Screens: Home, Discover, Bar Detail

// ═══════════════ HOME SCREEN ═══════════════
const HomeScreen = ({ onOpenBar, onOpenEvent, onOpenAnnonce, onNavigateTab }) => {
  const [search, setSearch] = React.useState('');
  const [joined, setJoined] = React.useState({});
  const allBars = BARS_DATA;
  const bars = search
    ? allBars.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.tagline.toLowerCase().includes(search.toLowerCase()) || b.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : allBars;
  const publics = ANNONCES_PUBLIC;
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  const h = now.getHours();
  const greeting = h < 6 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";

  // Aggregate upcoming events
  const upcoming = bars.flatMap(b => b.events.map(e => ({...e, bar: b}))).slice(0, 5);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 500 }}>{greeting}, Enzo</div>
          <div className="serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 2, lineHeight: 1 }}>
            Où allez-vous ce soir ?
          </div>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-card)', position: 'relative',
        }}>
          <Icon name="bell" size={20} color="var(--ink-soft)"/>
          <span style={{
            position: 'absolute', top: 9, right: 10,
            width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)',
            border: '2px solid #fff',
          }}/>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '4px 20px 18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', borderRadius: 14, padding: '12px 14px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <Icon name="search" size={18} color="var(--ink-mute)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bar, un événement…" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)' }}/>
          {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--ink-mute)', fontSize: 20, lineHeight: '1', paddingRight: 2 }}>×</span>}
        </div>
      </div>

      {/* Ouvert maintenant */}
      <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="serif" style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>Ouvert maintenant</h2>
        <span onClick={() => onNavigateTab?.('discover')} style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 600, cursor: 'pointer' }}>Voir tout</span>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollSnapType: 'x mandatory' }} className="noscroll">
        {bars.map(bar => (
          <div key={bar.id} onClick={() => onOpenBar(bar.id)}
            style={{
              flex: '0 0 230px', scrollSnapAlign: 'start',
              background: '#fff', borderRadius: 18, overflow: 'hidden',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}>
            <div style={{ position: 'relative' }}>
              <BarHero bar={bar} height={120} />
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(255,255,255,0.95)', borderRadius: 999,
                padding: '4px 9px', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
                color: barStatus(bar).openNow ? 'var(--success)' : 'var(--ink-mute)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: barStatus(bar).openNow ? 'var(--success)' : 'var(--ink-mute)',
                }}/>
                {barStatus(bar).openNow ? `Ouvert · ferme dans ${barStatus(bar).closesIn}` : barStatus(bar).opensIn}
              </div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{bar.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  <Icon name="star" size={12} color="var(--ochre-deep)"/>
                  {bar.rating}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                {bar.tagline} · {bar.distance}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                {bar.tags.slice(0, 2).map(t => <Tag key={t} size="sm">{t}</Tag>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cette semaine */}
      <div style={{ padding: '22px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="serif" style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>Cette semaine</h2>
        <span onClick={() => onNavigateTab?.('agenda')} style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 600, cursor: 'pointer' }}>Agenda →</span>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {upcoming.slice(0, 4).map(ev => (
          <div key={ev.id} onClick={() => onOpenEvent(ev)}
            style={{
              background: '#fff', borderRadius: 16, padding: 12,
              display: 'flex', gap: 12, alignItems: 'center',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}>
            <div style={{
              width: 58, height: 58, borderRadius: 12,
              background: `linear-gradient(135deg, ${ev.bar.color}, ${ev.bar.accent})`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>
                {ev.date.split(' ')[0]}
              </div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                {ev.date.match(/\d+/)?.[0]}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{ev.bar.name}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-mute)' }}/>
                <span>{ev.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Tag size="sm" color={ev.bar.color} bg={`${ev.bar.color}15`}>{ev.tag}</Tag>
                <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  · {ev.attending} intéressés
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Annonces publiques */}
      <div style={{ padding: '22px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h2 className="serif" style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>Ils sortent ce soir</h2>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>Rejoignez une soirée en un clic</div>
        </div>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {publics.slice(0, 3).map(a => (
          <div key={a.id} onClick={() => onOpenAnnonce(a)}
            style={{
              background: '#fff', borderRadius: 16, padding: 14,
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              borderLeft: `3px solid ${a.color}`,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar letter={a.avatar} color={a.color} size={32}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  <b>{a.author}</b> propose
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{a.when} · {a.bar}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
                {[...Array(Math.min(a.attending, 3))].map((_, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: ['#C65D3D', '#6B3A4A', '#D9A44A', '#6D7A3D'][i],
                    border: '2px solid #fff',
                    marginLeft: i === 0 ? 0 : -8,
                  }}/>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10, lineHeight: 1.3 }}>
              {a.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                {a.attending + (joined[a.id] ? 1 : 0)}/{a.maxAttending} places
              </div>
              <div onClick={e => { e.stopPropagation(); setJoined(j => ({...j, [a.id]: !j[a.id]})); }} style={{
                background: joined[a.id] ? 'var(--success)' : 'var(--ink)', color: '#fff',
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s',
              }}>{joined[a.id] ? '✓ Je viens' : 'Je viens'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════ DISCOVER (LIST + MAP TOGGLE) ═══════════════
const DiscoverScreen = ({ onOpenBar }) => {
  const [view, setView] = React.useState('list');
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  const bars = BARS_DATA;
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px 12px' }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>Les bars</div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
          3 lieux à Bruz · tous à moins d'1 km
        </div>
      </div>

      {/* Segmented control */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          display: 'flex', background: 'rgba(42,31,23,0.06)',
          borderRadius: 12, padding: 4,
        }}>
          {['list', 'map'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                flex: 1, background: view === v ? '#fff' : 'transparent',
                border: 'none', borderRadius: 9,
                padding: '8px 0', fontSize: 13, fontWeight: 600,
                color: view === v ? 'var(--ink)' : 'var(--ink-mute)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}>
              <Icon name={v === 'list' ? 'list' : 'map'} size={15}/>
              {v === 'list' ? 'Liste' : 'Carte'}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bars.map(bar => (
            <div key={bar.id} onClick={() => onOpenBar(bar.id)}
              style={{
                background: '#fff', borderRadius: 18, overflow: 'hidden',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              }}>
              <BarHero bar={bar} height={140}/>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <OpenDot open={barStatus(bar).openNow}/>
                      <span style={{ fontSize: 11, fontWeight: 600, color: barStatus(bar).openNow ? 'var(--success)' : 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {barStatus(bar).openNow ? 'Ouvert' : 'Fermé'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                        {barStatus(bar).openNow ? `· ferme à ${barStatus(bar).closesAt}` : `· ${barStatus(bar).opensIn}`}
                      </span>
                    </div>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{bar.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 1 }}>{bar.tagline}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600 }}>
                      <Icon name="star" size={14} color="var(--ochre-deep)"/>
                      {bar.rating}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{bar.reviews} avis</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', gap: 6, marginTop: 10, alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  {bar.tags.map(t => <Tag key={t} size="sm">{t}</Tag>)}
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 'auto' }}>
                    <Icon name="pin" size={11}/> {bar.distance}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MapView bars={bars} onOpenBar={onOpenBar}/>
      )}
    </div>
  );
};

// ═══════════════ MAP VIEW ═══════════════
const MapView = ({ bars, onOpenBar }) => {
  const [selected, setSelected] = React.useState(bars[0].id);
  const sel = bars.find(b => b.id === selected);
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  // Fake map with a stylized grid
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        position: 'relative', borderRadius: 18, overflow: 'hidden',
        height: 420, background: '#E8DFCE',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* stylized map */}
        <svg viewBox="0 0 400 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(42,31,23,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="400" height="420" fill="#F0E6D2"/>
          <rect width="400" height="420" fill="url(#mapgrid)"/>
          {/* Rivers / roads */}
          <path d="M0,180 Q100,160 200,200 T400,220" stroke="#D9CDB5" strokeWidth="22" fill="none"/>
          <path d="M0,180 Q100,160 200,200 T400,220" stroke="#F5ECD8" strokeWidth="18" fill="none"/>
          <path d="M180,0 Q200,200 160,420" stroke="#D9CDB5" strokeWidth="16" fill="none"/>
          <path d="M180,0 Q200,200 160,420" stroke="#F5ECD8" strokeWidth="12" fill="none"/>
          <path d="M0,340 L400,320" stroke="#D9CDB5" strokeWidth="12" fill="none"/>
          <path d="M0,340 L400,320" stroke="#F5ECD8" strokeWidth="9" fill="none"/>
          {/* park */}
          <ellipse cx="90" cy="100" rx="60" ry="45" fill="#CDD9B5" opacity="0.7"/>
          <ellipse cx="320" cy="370" rx="70" ry="40" fill="#CDD9B5" opacity="0.7"/>
          {/* buildings */}
          {[[50,250,30,20],[100,270,40,30],[250,80,30,25],[280,150,40,35],[60,380,50,30]].map(([x,y,w,h],i) =>
            <rect key={i} x={x} y={y} width={w} height={h} fill="#E5D8BC" opacity="0.8" rx="2"/>)}
        </svg>
        {/* Pins */}
        {bars.map((bar, i) => {
          const positions = [
            { x: 145, y: 210 }, { x: 230, y: 160 }, { x: 280, y: 260 }
          ];
          const p = positions[i];
          const isSel = selected === bar.id;
          return (
            <div key={bar.id} onClick={() => setSelected(bar.id)}
              style={{
                position: 'absolute', left: `${(p.x / 400) * 100}%`, top: `${(p.y / 420) * 100}%`,
                transform: `translate(-50%, -100%) scale(${isSel ? 1.15 : 1})`,
                transition: 'transform 0.2s', cursor: 'pointer',
                zIndex: isSel ? 10 : 1,
              }}>
              <div style={{
                background: bar.color, color: '#fff',
                padding: '8px 12px', borderRadius: 999,
                fontSize: 13, fontWeight: 600,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name={{ostal:'wine',pignom:'beer','arriere-cour':'cocktail'}[bar.id]} size={14} color="#fff"/>
                {bar.name}
              </div>
              <div style={{
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `8px solid ${bar.color}`,
                margin: '0 auto',
              }}/>
            </div>
          );
        })}
        {/* Bottom card for selected */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          background: '#fff', borderRadius: 14, padding: 12,
          display: 'flex', gap: 12, alignItems: 'center',
          boxShadow: 'var(--shadow-float)',
        }} onClick={() => onOpenBar(sel.id)}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${sel.color}, ${sel.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={{ostal:'wine',pignom:'beer','arriere-cour':'cocktail'}[sel.id]} size={22} color="#fff"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>{sel.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <OpenDot open={barStatus(sel).openNow}/>
              {barStatus(sel).openNow ? 'Ouvert' : 'Fermé'} · {sel.distance}
            </div>
          </div>
          <Icon name="chevron" size={16} color="var(--ink-mute)"/>
        </div>
      </div>
    </div>
  );
};

export { HomeScreen, DiscoverScreen, MapView };
