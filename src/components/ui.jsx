import React from 'react'

// Shared UI primitives for Bars à Bruz

// ─────────── ICONS ───────────
const Icon = ({ name, size = 20, color = 'currentColor', stroke = 1.8 }) => {
  const s = stroke;
  const paths = {
    home: <><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c2.8.5 5 2.8 5 5.8"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20.5c0-3.9 3.1-7 7-7s7 3.1 7 7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin: <><path d="M12 22s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
    star: <><path d="M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1L12 2z"/></>,
    heart: <><path d="M12 20.5s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <><path d="M9 6l6 6-6 6"/></>,
    chevronL: <><path d="M15 6l-6 6 6 6"/></>,
    chevronD: <><path d="M6 9l6 6 6-6"/></>,
    back: <><path d="M19 12H5M12 5l-7 7 7 7"/></>,
    close: <><path d="M6 6l12 12M18 6L6 18"/></>,
    more: <><circle cx="12" cy="5" r="1.3" fill={color} stroke="none"/><circle cx="12" cy="12" r="1.3" fill={color} stroke="none"/><circle cx="12" cy="19" r="1.3" fill={color} stroke="none"/></>,
    bell: <><path d="M6 15.5V10a6 6 0 1112 0v5.5l1.5 2h-15l1.5-2zM10 20a2 2 0 004 0"/></>,
    wine: <><path d="M8 3h8l-1 5a3 3 0 01-3 3h0a3 3 0 01-3-3L8 3zM12 11v8M9 21h6"/></>,
    beer: <><path d="M6 7h10v13a1 1 0 01-1 1H7a1 1 0 01-1-1V7zM16 10h2a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><path d="M6 7c0-2 1.5-3 3-3s1.5 1 3 1 2-1 4-1"/></>,
    cocktail: <><path d="M4 5h16l-8 9-8-9zM12 14v7M8 21h8"/></>,
    music: <><path d="M8 17V6l10-2v11"/><circle cx="6" cy="17" r="2.5"/><circle cx="16" cy="15" r="2.5"/></>,
    cake: <><path d="M4 13h16v7H4zM4 13c0-2 2-3 4-3s2 1 4 1 2-1 4-1 4 1 4 3"/><path d="M12 7v3M9 4l3 3 3-3"/></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></>,
    send: <><path d="M21 3L3 10l7 3 3 7 8-17z"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>,
    flame: <><path d="M12 3c0 4-5 5-5 10a5 5 0 0010 0c0-2-1-3-2-4 0 2-1 3-2 3 0-3 2-4-1-9z"/></>,
    check: <><path d="M5 12l4 4 10-10"/></>,
    ticket: <><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V9z"/><path d="M12 7v10" strokeDasharray="2 2"/></>,
    phone: <><path d="M5 4h4l2 5-3 2a16 16 0 006 6l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></>,
    filter: <><path d="M3 5h18l-7 9v5l-4 2v-7L3 5z"/></>,
    map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill={color} stroke="none"/><circle cx="4" cy="12" r="1" fill={color} stroke="none"/><circle cx="4" cy="18" r="1" fill={color} stroke="none"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}>
      {paths[name]}
    </svg>
  );
};

// ─────────── AVATAR ───────────
const Avatar = ({ letter, src, color = '#C65D3D', size = 36, ring = false, style }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: src ? '#e8e0d8' : `linear-gradient(135deg, ${color}, ${shade(color, -15)})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 600, fontSize: size * 0.42,
    fontFamily: 'Fraunces, Georgia, serif',
    flexShrink: 0, overflow: 'hidden',
    boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
    ...style,
  }}>
    {src
      ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
      : letter}
  </div>
);

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + pct * 2.55;
  let g = ((n >> 8) & 0xff) + pct * 2.55;
  let b = (n & 0xff) + pct * 2.55;
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─────────── BAR HERO ───────────
const BarHero = ({ bar, height = 180, small = false }) => {
  const iconMap = { ostal: 'wine', pignom: 'beer', 'arriere-cour': 'cocktail' };
  const icon = iconMap[bar.id] || 'wine';

  const containerStyle = bar.image ? {
    height, width: '100%',
    position: 'relative', overflow: 'hidden',
    borderRadius: small ? 14 : 0,
    '--bar-photo': `url(${bar.image})`,
    '--bar-color': bar.color,
    '--bar-accent': bar.accent,
  } : {
    height, width: '100%',
    background: `linear-gradient(135deg, ${bar.color}, ${bar.accent})`,
    position: 'relative', overflow: 'hidden',
    borderRadius: small ? 14 : 0,
  };

  return (
    <div className={bar.image ? 'bar-hero bar-hero--photo' : 'bar-hero'} style={containerStyle}>
      {bar.image ? (
        <>
          <div className="bar-hero__photo" />
          <div className="bar-hero__vignette" />
        </>
      ) : (
        <>
          {/* dot pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
            <defs>
              <pattern id={`dots-${bar.id}`} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#fff"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#dots-${bar.id})`}/>
          </svg>
          {/* sweeping curve */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 400 200">
            <path d={`M0,${height * 0.7} Q200,${height * 0.3} 400,${height * 0.8} L400,200 L0,200 Z`}
              fill="rgba(255,255,255,0.12)" />
          </svg>
        </>
      )}
      {/* glyph */}
      <div style={{
        position: 'absolute', right: small ? 10 : 20, bottom: small ? 10 : 20,
        zIndex: 3,
        width: small ? 44 : 64, height: small ? 44 : 64,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.3)',
      }}>
        <Icon name={icon} size={small ? 22 : 32} color="#fff" stroke={1.6}/>
      </div>
      {/* name */}
      {!small && (
        <div style={{
          position: 'absolute', left: 20, bottom: 20, right: 100,
          zIndex: 3,
          color: '#fff',
        }}>
          <div className="serif" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            {bar.name}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, opacity: 0.92, fontStyle: 'italic', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {bar.tagline}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────── TAG / BADGE ───────────
const Tag = ({ children, color, bg, size = 'md' }) => {
  const p = size === 'sm' ? '3px 8px' : '5px 10px';
  const fs = size === 'sm' ? 10 : 11;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: p, borderRadius: 999,
      background: bg || 'rgba(42,31,23,0.06)',
      color: color || 'var(--ink-soft)',
      fontSize: fs, fontWeight: 500, letterSpacing: '0.01em',
      textTransform: 'uppercase',
    }}>{children}</span>
  );
};

// ─────────── OPEN STATUS DOT ───────────
const OpenDot = ({ open }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 500,
    color: open ? 'var(--success)' : 'var(--ink-mute)',
  }}>
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: open ? 'var(--success)' : 'var(--ink-mute)',
      boxShadow: open ? '0 0 0 3px rgba(109,143,82,0.2)' : 'none',
    }}/>
  </span>
);

// ─────────── WIP OVERLAY ───────────
const Wip = ({ children }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ filter: 'grayscale(0.9)', opacity: 0.38, pointerEvents: 'none', userSelect: 'none' }}>
      {children}
    </div>
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      <span style={{
        transform: 'rotate(-18deg)',
        fontSize: 12, fontWeight: 800, letterSpacing: '0.12em',
        color: 'rgba(42,31,23,0.5)', textTransform: 'uppercase',
        whiteSpace: 'nowrap', userSelect: 'none', fontFamily: 'inherit',
      }}>
        🚧 En travaux
      </span>
    </div>
  </div>
);

export { Icon, Avatar, BarHero, Tag, OpenDot, shade, Wip };
