import React from 'react'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade, Wip } from '../components/ui'
import { getBarStatus, useCurrentTime } from '../utils/barStatus'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const getParticipantCount = (attending, participantRows) => Math.max(attending, participantRows + 1)

// Screens: Home, Discover, Bar Detail

// ═══════════════ SORTIE DETAIL SHEET ═══════════════

const SortieDetailSheet = ({ annonce: a, participants, joined, isCreator, authUser, onJoin, onUnjoin, onDelete, onClose }) => {
  const displayParticipants = participants ?? []
  const participantCount = getParticipantCount(a.attending, displayParticipants.length)
  const isFull = participantCount >= a.maxAttending
  const canJoin = authUser && !joined && !isFull && !isCreator
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--paper)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '88%', overflow: 'auto',
        animation: 'slideUp 0.25s',
      }}>
        <div style={{ height: 4, background: a.color, borderRadius: '28px 28px 0 0' }}/>
        <div style={{ padding: '20px 20px 44px' }}>

          {/* Author + close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar letter={a.avatar} color={a.color} size={42}/>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.author}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  {isCreator ? 'Ta sortie' : 'propose une sortie'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isCreator && (
                <button onClick={() => setConfirmDelete(true)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(198,93,61,0.1)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Icon name="trash" size={15} color="var(--terracotta)"/>
                </button>
              )}
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(42,31,23,0.08)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Icon name="close" size={16} color="var(--ink-mute)"/>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 16, lineHeight: 1.25 }}>
            {a.title}
          </div>

          {/* Info rows */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'pin', label: a.bar, sub: 'Lieu' },
              { icon: 'clock', label: a.when, sub: 'Quand' },
            ].map(item => (
              <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${a.color}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={item.icon} size={16} color={a.color}/>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Participants block */}
          <div style={{ marginTop: 20, padding: 14, borderRadius: 14, background: '#fff', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Participants</div>
                <div style={{ fontSize: 11, color: isFull ? 'var(--terracotta)' : 'var(--ink-mute)', marginTop: 2 }}>
                  {participantCount} / {a.maxAttending} places{isFull ? ' · Complet' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {displayParticipants.slice(0, 5).map((p, i) => (
                  <Avatar key={p.user_id} letter={p.avatar_letter} color={p.color} size={28}
                    style={{ marginLeft: i === 0 ? 0 : -10, border: '2px solid #fff' }}/>
                ))}
                {participantCount > 5 && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--line)', border: '2px solid #fff',
                    marginLeft: -10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 600, color: 'var(--ink-soft)',
                  }}>+{participantCount - 5}</div>
                )}
              </div>
            </div>

            {/* Named participants list */}
            {displayParticipants.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {displayParticipants.map(p => (
                  <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar letter={p.avatar_letter} color={p.color} size={24}/>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 4, borderRadius: 999, background: 'rgba(42,31,23,0.08)', marginTop: 10 }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: isFull ? 'var(--terracotta)' : a.color,
                width: `${Math.min((participantCount / a.maxAttending) * 100, 100)}%`,
                transition: 'width 0.3s',
              }}/>
            </div>
          </div>

          {/* CTAs */}
          {isCreator ? (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: 'rgba(198,93,61,0.06)', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
              C'est ta sortie · {participantCount} personne{participantCount !== 1 ? 's' : ''} participe{participantCount !== 1 ? 'nt' : ''}
            </div>
          ) : joined ? (
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, padding: '14px 0', borderRadius: 14, textAlign: 'center',
                background: '#4A7C5915', border: '1.5px solid #4A7C59',
                fontSize: 14, fontWeight: 600, color: '#4A7C59',
              }}>
                ✓ Tu participes
              </div>
              <button onClick={onUnjoin} style={{
                padding: '14px 18px', borderRadius: 14,
                background: '#fff', border: '1.5px solid var(--line)',
                fontSize: 13, fontWeight: 600, color: 'var(--ink-mute)',
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
                Se désinscrire
              </button>
            </div>
          ) : (
            <button onClick={onJoin} disabled={!canJoin} style={{
              width: '100%', marginTop: 14,
              padding: '15px 0', borderRadius: 14,
              background: isFull ? 'var(--line)' : !authUser ? 'var(--ink-mute)' : 'var(--terracotta)',
              color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
              cursor: canJoin ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}>
              {isFull ? 'Complet' : !authUser ? 'Connecte-toi pour rejoindre' : 'Je viens !'}
            </button>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }} onClick={() => setConfirmDelete(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 20, padding: 24,
                width: '100%', maxWidth: 340,
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Annuler la sortie ?</div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, marginBottom: 24 }}>
                  Les participants seront prévenus. Cette action est irréversible.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: 'var(--paper)', color: 'var(--ink)',
                    border: '1px solid var(--line)', fontSize: 14, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>Garder</button>
                  <button onClick={() => { onDelete(); onClose() }} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: 'var(--terracotta)', color: '#fff',
                    border: 'none', fontSize: 14, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>Annuler la sortie</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════ HOME SCREEN ═══════════════
const HomeScreen = ({ onOpenBar, onOpenEvent, onOpenAnnonce, onNewSortie, onNavigateTab }) => {
  const { bars: allBars, annonces: publics, participantsMap, user: userData, joinAnnonce, unjoinAnnonce, deleteAnnonce, joinedAnnonceIds } = useData()
  const { user: authUser } = useAuth()
  const [search, setSearch] = React.useState('')
  const [selectedAnnonce, setSelectedAnnonce] = React.useState(null)

  const handleJoin = (annonceId, currentAttending) => {
    const a = publics.find(x => x.id === annonceId)
    const participantCount = getParticipantCount(a?.attending ?? 0, (participantsMap[annonceId] ?? []).length)
    if (!authUser || joinedAnnonceIds.has(annonceId) || (a && participantCount >= a.maxAttending)) return
    joinAnnonce(annonceId, currentAttending)
    // Keep selectedAnnonce in sync
    setSelectedAnnonce(prev => prev?.id === annonceId ? { ...prev, attending: prev.attending + 1 } : prev)
  }

  const handleUnjoin = (annonceId) => {
    unjoinAnnonce(annonceId)
    setSelectedAnnonce(prev => prev?.id === annonceId ? { ...prev, attending: Math.max(0, prev.attending - 1) } : prev)
  }

  const handleDelete = (annonceId) => {
    deleteAnnonce(annonceId)
    setSelectedAnnonce(null)
  }
  const bars = search
    ? allBars.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.tagline.toLowerCase().includes(search.toLowerCase()) || b.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : allBars;
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
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 500 }}>{greeting}, {authUser ? userData.name : 'toi'}</div>
          <div className="serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 2, lineHeight: 1 }}>
            Où allez-vous ce soir ?
          </div>
        </div>
        <Wip>
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
        </Wip>
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

      {/* Ils sortent ce soir */}
      <div style={{ padding: '22px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="serif" style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>Ils sortent ce soir</h2>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>Rejoignez une soirée en un clic</div>
        </div>
        {authUser && onNewSortie && (
          <button onClick={onNewSortie} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 13px', borderRadius: 999,
            background: 'var(--terracotta)', color: '#fff',
            border: 'none', fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(198,93,61,0.3)',
          }}>
            <Icon name="plus" size={13} color="#fff"/>
            Proposer
          </button>
        )}
      </div>

      {publics.length === 0 ? (
        <div onClick={authUser ? onNewSortie : undefined} style={{
          margin: '0 20px',
          padding: 24, borderRadius: 16, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(198,93,61,0.06), rgba(217,164,74,0.06))',
          border: '1px dashed rgba(198,93,61,0.3)',
          cursor: authUser ? 'pointer' : 'default',
        }}>
          <div style={{ fontSize: 28 }}>🍻</div>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>
            {authUser ? 'Sois le premier à proposer !' : 'Pas encore de sorties ce soir'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
            {authUser ? 'Organise une soirée et invite la communauté' : 'Connecte-toi pour en proposer une'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {publics.slice(0, 5).map(a => {
            const participantCount = getParticipantCount(a.attending, (participantsMap[a.id] ?? []).length)
            const hasJoined = joinedAnnonceIds.has(a.id)
            const isFull = participantCount >= a.maxAttending
            const isCreator = authUser && a.user_id === authUser.id
            const canJoin = authUser && !hasJoined && !isFull && !isCreator
            const canUnjoin = authUser && hasJoined && !isCreator

            return (
              <div key={a.id} onClick={() => setSelectedAnnonce(a)} style={{
                background: '#fff', borderRadius: 16, padding: 14,
                boxShadow: 'var(--shadow-card)',
                borderLeft: `3px solid ${a.color}`,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar letter={a.avatar} color={a.color} size={32}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      <b>{a.author}</b>{isCreator ? ' · Ta sortie' : ' propose'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{a.when} · {a.bar}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {(participantsMap[a.id] ?? []).slice(0, 3).map((p, i) => (
                      <Avatar key={p.user_id} letter={p.avatar_letter} color={p.color} size={22}
                        style={{ marginLeft: i === 0 ? 0 : -8, border: '2px solid #fff' }}/>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10, lineHeight: 1.3 }}>
                  {a.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: isFull ? 'var(--terracotta)' : 'var(--ink-mute)' }}>
                    {participantCount}/{a.maxAttending} places{isFull ? ' · Complet' : ''}
                  </div>
                  {!isCreator && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        hasJoined ? handleUnjoin(a.id) : handleJoin(a.id, participantCount)
                      }}
                      disabled={!canJoin && !canUnjoin}
                      style={{
                        background: hasJoined ? '#4A7C59' : isFull ? 'var(--line)' : !authUser ? 'var(--ink-mute)' : 'var(--ink)',
                        color: '#fff',
                        padding: '6px 14px', borderRadius: 999,
                        fontSize: 12, fontWeight: 600,
                        border: 'none', fontFamily: 'inherit',
                        cursor: (canJoin || canUnjoin) ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                      }}
                    >
                      {hasJoined ? '✓ Je viens' : isFull ? 'Complet' : !authUser ? 'Connecte-toi' : 'Je viens'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sortie detail sheet */}
      {selectedAnnonce && (
        <SortieDetailSheet
          annonce={selectedAnnonce}
          participants={participantsMap[selectedAnnonce.id] ?? []}
          joined={joinedAnnonceIds.has(selectedAnnonce.id)}
          isCreator={!!(authUser && selectedAnnonce.user_id === authUser.id)}
          authUser={authUser}
          onJoin={() => handleJoin(selectedAnnonce.id, selectedAnnonce.attending)}
          onUnjoin={() => handleUnjoin(selectedAnnonce.id)}
          onDelete={() => handleDelete(selectedAnnonce.id)}
          onClose={() => setSelectedAnnonce(null)}
        />
      )}
    </div>
  );
};

// ═══════════════ DISCOVER (LIST + MAP TOGGLE) ═══════════════
const DiscoverScreen = ({ onOpenBar }) => {
  const { bars } = useData()
  const [view, setView] = React.useState('list');
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
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
const BAR_ICONS = { ostal: 'wine', pignom: 'beer', 'arriere-cour': 'cocktail' };
const PIN_POSITIONS = [{ x: 145, y: 210 }, { x: 230, y: 160 }, { x: 280, y: 260 }];

const MapView = ({ bars, onOpenBar }) => {
  const [selected, setSelected] = React.useState(null);
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  const sel = bars.find(b => b.id === selected);

  const openMaps = (bar, e) => {
    e.stopPropagation();
    window.open(bar.mapsUrl, '_blank', 'noopener');
  };

  return (
    <div style={{ padding: '0 20px' }} onClick={() => setSelected(null)}>
      <div style={{
        position: 'relative', borderRadius: 18, overflow: 'hidden',
        height: sel ? 460 : 420, background: '#E8DFCE',
        boxShadow: 'var(--shadow-card)',
        transition: 'height 0.25s ease',
      }}>
        {/* Stylized map */}
        <svg viewBox="0 0 400 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(42,31,23,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="400" height="420" fill="#F0E6D2"/>
          <rect width="400" height="420" fill="url(#mapgrid)"/>
          <path d="M0,180 Q100,160 200,200 T400,220" stroke="#D9CDB5" strokeWidth="22" fill="none"/>
          <path d="M0,180 Q100,160 200,200 T400,220" stroke="#F5ECD8" strokeWidth="18" fill="none"/>
          <path d="M180,0 Q200,200 160,420" stroke="#D9CDB5" strokeWidth="16" fill="none"/>
          <path d="M180,0 Q200,200 160,420" stroke="#F5ECD8" strokeWidth="12" fill="none"/>
          <path d="M0,340 L400,320" stroke="#D9CDB5" strokeWidth="12" fill="none"/>
          <path d="M0,340 L400,320" stroke="#F5ECD8" strokeWidth="9" fill="none"/>
          <ellipse cx="90" cy="100" rx="60" ry="45" fill="#CDD9B5" opacity="0.7"/>
          <ellipse cx="320" cy="370" rx="70" ry="40" fill="#CDD9B5" opacity="0.7"/>
          {[[50,250,30,20],[100,270,40,30],[250,80,30,25],[280,150,40,35],[60,380,50,30]].map(([x,y,w,h],i) =>
            <rect key={i} x={x} y={y} width={w} height={h} fill="#E5D8BC" opacity="0.8" rx="2"/>)}
        </svg>

        {/* Pins */}
        {bars.map((bar, i) => {
          const p = PIN_POSITIONS[i];
          const isSel = selected === bar.id;
          const status = barStatus(bar);
          return (
            <div key={bar.id}
              onClick={e => { e.stopPropagation(); setSelected(isSel ? null : bar.id); }}
              style={{
                position: 'absolute',
                left: `${(p.x / 400) * 100}%`,
                top: `${(p.y / 420) * 100}%`,
                transform: `translate(-50%, -100%) scale(${isSel ? 1.12 : 1})`,
                transition: 'transform 0.2s',
                cursor: 'pointer',
                zIndex: isSel ? 20 : 5,
              }}>
              {/* Info bubble — shown when selected */}
              {isSel && (
                <div onClick={e => openMaps(bar, e)} style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)',
                  left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', borderRadius: 12, padding: '10px 12px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap', minWidth: 180,
                  cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                    {bar.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-mute)', marginBottom: 7 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: status.openNow ? 'var(--success)' : 'var(--ink-mute)',
                    }}/>
                    {status.openNow ? `Ouvert · ferme à ${status.closesAt}` : `Fermé · ${status.opensIn}`}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    background: bar.color, color: '#fff',
                    borderRadius: 8, padding: '5px 10px',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    <Icon name="pin" size={11} color="#fff"/>
                    Ouvrir dans Maps
                  </div>
                  {/* Pointer */}
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderTop: '6px solid #fff',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                  }}/>
                </div>
              )}

              {/* Pin */}
              <div style={{
                background: bar.color, color: '#fff',
                padding: '7px 11px', borderRadius: 999,
                fontSize: 13, fontWeight: 600,
                boxShadow: isSel ? `0 4px 16px ${bar.color}66` : '0 3px 10px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                border: isSel ? '2px solid #fff' : '2px solid transparent',
                transition: 'box-shadow 0.2s, border 0.2s',
              }}>
                <Icon name={BAR_ICONS[bar.id]} size={13} color="#fff"/>
                {bar.name}
              </div>
              <div style={{
                width: 0, height: 0,
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderTop: `7px solid ${bar.color}`,
                margin: '0 auto',
              }}/>
            </div>
          );
        })}

        {/* Bottom card for selected bar */}
        {sel && (
          <div
            onClick={e => { e.stopPropagation(); onOpenBar(sel.id); }}
            style={{
              position: 'absolute', bottom: 12, left: 12, right: 12,
              background: '#fff', borderRadius: 14, padding: 12,
              display: 'flex', gap: 12, alignItems: 'center',
              boxShadow: 'var(--shadow-float)', cursor: 'pointer',
              animation: 'fadeUp 0.2s ease',
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${sel.color}, ${sel.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={BAR_ICONS[sel.id]} size={20} color="#fff"/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sel.address}
              </div>
            </div>
            <div style={{
              background: sel.color, color: '#fff',
              padding: '6px 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 600, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Icon name="pin" size={11} color="#fff"/>
              Maps
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-mute)' }}>
        Appuyez sur un marqueur pour ouvrir dans Maps
      </div>
    </div>
  );
};

export { HomeScreen, DiscoverScreen, MapView, SortieDetailSheet };
