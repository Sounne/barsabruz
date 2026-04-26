import React from 'react'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { getBarStatus, useCurrentTime } from '../utils/barStatus'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const getParticipantCount = (attending, participantRows) => Math.max(attending, participantRows + 1)

const VISIBILITY_META = {
  private: { label: 'Privé', icon: 'lock', color: '#6B3A4A' },
  friends: { label: 'Amis', icon: 'users', color: '#4A7C59' },
  public:  { label: 'Public', icon: 'globe', color: '#3A6AB0' },
}

const VisibilityBadge = ({ visibility, size = 'sm' }) => {
  const m = VISIBILITY_META[visibility] || VISIBILITY_META.public
  const isLg = size === 'lg'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: isLg ? '3px 8px' : '2px 6px',
      borderRadius: 999,
      background: `${m.color}15`, color: m.color,
      fontSize: isLg ? 11 : 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <Icon name={m.icon} size={isLg ? 11 : 10} color={m.color}/>
      {m.label}
    </span>
  )
}

// Screens: Home, Discover, Bar Detail

// ═══════════════ SORTIE DETAIL SHEET ═══════════════

const InviteFriendsSheet = ({ annonce, onClose, onInvited }) => {
  const { friends, inviteFriendsToAnnonce } = useData()
  const [selected, setSelected] = React.useState(new Set())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const handleSend = async () => {
    if (!selected.size) return
    setSubmitting(true); setError(null)
    try {
      await inviteFriendsToAnnonce(annonce.id, [...selected])
      onInvited?.(selected.size)
      onClose()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Impossible d\'envoyer les invitations.')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--paper)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%', overflow: 'auto', animation: 'slideUp 0.25s',
      }}>
        <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Inviter des amis</div>
          <button onClick={handleSend} disabled={!selected.size || submitting} style={{
            fontSize: 14, fontWeight: 600,
            color: selected.size && !submitting ? 'var(--terracotta)' : 'var(--ink-mute)',
            background: 'none', border: 'none',
            cursor: selected.size && !submitting ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>{submitting ? '…' : `Envoyer${selected.size ? ` (${selected.size})` : ''}`}</button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Qui veux-tu inviter ?</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
            Tes amis recevront une invitation à rejoindre « {annonce.title} ».
          </div>

          {friends.length === 0 ? (
            <div style={{
              marginTop: 20, padding: 20, borderRadius: 14, textAlign: 'center',
              background: 'rgba(198,93,61,0.06)', border: '1px dashed rgba(198,93,61,0.25)',
            }}>
              <div style={{ fontSize: 24 }}>👋</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
                Tu n'as pas encore d'amis à inviter.
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friends.map(f => {
                const isSel = selected.has(f.id)
                return (
                  <button key={f.id} onClick={() => toggle(f.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12,
                    background: isSel ? 'rgba(198,93,61,0.1)' : '#fff',
                    border: isSel ? '2px solid var(--terracotta)' : '1px solid var(--line)',
                    fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <Avatar letter={f.avatar_letter} src={f.avatar_url} color={f.color} size={36}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{f.handle}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: isSel ? 'var(--terracotta)' : '#fff',
                      border: isSel ? 'none' : '1.5px solid var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>{isSel ? '✓' : ''}</div>
                  </button>
                )
              })}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(198,93,61,0.1)', fontSize: 13, color: 'var(--terracotta)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SortieDetailSheet = ({ annonce: a, participants, joined, isCreator, authUser, onJoin, onUnjoin, onDelete, onClose }) => {
  const displayParticipants = participants ?? []
  const participantCount = getParticipantCount(a.attending, displayParticipants.length)
  const isFull = participantCount >= a.maxAttending
  const canJoin = authUser && !joined && !isFull && !isCreator
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [showInvite, setShowInvite] = React.useState(false)
  const [invitedToast, setInvitedToast] = React.useState(null)
  const [closing, setClosing] = React.useState(false)
  const requestClose = React.useCallback(() => setClosing(true), [])

  return (
    <Sheet
      className="sortie-sheet"
      label="Détail de la sortie"
      closing={closing}
      onClose={requestClose}
      onExited={onClose}
      zIndex={200}
    >
      <div style={{ height: 4, background: a.color, borderRadius: '28px 28px 0 0' }}/>
        <div style={{ padding: '20px 20px 44px' }}>

          {/* Author + close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar letter={a.avatar} src={a.avatar_url} color={a.color} size={42}/>
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
              <button onClick={requestClose} style={{
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
          {a.visibility && (
            <div style={{ marginTop: 8 }}>
              <VisibilityBadge visibility={a.visibility} size="lg"/>
            </div>
          )}

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
                  <Avatar key={p.user_id} letter={p.avatar_letter} src={p.avatar_url} color={p.color} size={28}
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
                    <Avatar letter={p.avatar_letter} src={p.avatar_url} color={p.color} size={24}/>
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
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(198,93,61,0.06)', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
                C'est ta sortie · {participantCount} personne{participantCount !== 1 ? 's' : ''} participe{participantCount !== 1 ? 'nt' : ''}
              </div>
              {a.visibility === 'private' && (
                <button onClick={() => setShowInvite(true)} style={{
                  width: '100%', padding: '13px 0', borderRadius: 14,
                  background: 'var(--terracotta)', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Icon name="plus" size={15} color="#fff"/>
                  Inviter des amis
                </button>
              )}
              {invitedToast && (
                <div style={{
                  padding: 10, borderRadius: 10, fontSize: 13, textAlign: 'center',
                  background: 'rgba(74,124,89,0.12)', color: '#4A7C59', fontWeight: 500,
                }}>
                  ✓ {invitedToast} invitation{invitedToast > 1 ? 's' : ''} envoyée{invitedToast > 1 ? 's' : ''}
                </div>
              )}
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

          {showInvite && (
            <InviteFriendsSheet
              annonce={a}
              onClose={() => setShowInvite(false)}
              onInvited={n => { setInvitedToast(n); setTimeout(() => setInvitedToast(null), 3500) }}
            />
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
                  <button onClick={() => { onDelete(); requestClose() }} style={{
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
    </Sheet>
  )
}

// ═══════════════ HOME SCREEN ═══════════════
const HomeScreen = ({ onOpenBar, onOpenEvent, onOpenAnnonce, onNewSortie, onNavigateTab, onOpenNotifications }) => {
  const { bars: allBars, agendaEvents, annonces: publics, participantsMap, user: userData, joinAnnonce, unjoinAnnonce, joinedAnnonceIds, invitations, acceptInvitation, declineInvitation, unreadNotificationCount } = useData()
  const { user: authUser } = useAuth()
  const [search, setSearch] = React.useState('')

  const handleJoin = (annonceId, currentAttending) => {
    const a = publics.find(x => x.id === annonceId)
    const participantCount = getParticipantCount(a?.attending ?? 0, (participantsMap[annonceId] ?? []).length)
    if (!authUser || joinedAnnonceIds.has(annonceId) || (a && participantCount >= a.maxAttending)) return
    joinAnnonce(annonceId, currentAttending)
  }

  const handleUnjoin = (annonceId) => {
    unjoinAnnonce(annonceId)
  }

  const enrichAnnonce = (a) =>
    authUser && a.user_id === authUser.id
      ? { ...a, avatar_url: userData?.avatarUrl ?? a.avatar_url, avatar: userData?.avatar ?? a.avatar }
      : a

  const bars = search
    ? allBars.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.tagline.toLowerCase().includes(search.toLowerCase()) || b.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : allBars;
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  const h = now.getHours();
  const greeting = h < 6 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";

  const upcoming = agendaEvents
    .filter(event => bars.some(bar => bar.id === event.bar.id))
    .slice(0, 5)

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
        {authUser && (
          <button onClick={onOpenNotifications} style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-card)', position: 'relative',
            border: 'none', cursor: 'pointer',
          }} aria-label="Ouvrir les notifications">
            <Icon name="bell" size={20} color="var(--ink-soft)"/>
            {unreadNotificationCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 19, height: 19, padding: '0 5px',
                borderRadius: 999, background: 'var(--terracotta)',
                color: '#fff', border: '2px solid #fff',
                fontSize: 10, fontWeight: 800, lineHeight: '15px',
                textAlign: 'center',
              }}>
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        )}
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

      {/* Invitations reçues */}
      {authUser && invitations && invitations.length > 0 && (
        <div style={{ padding: '22px 20px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--terracotta)', color: '#fff',
              fontSize: 11, fontWeight: 700,
            }}>{invitations.length}</span>
            <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Tu es invité·e</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invitations.map(inv => (
              <div key={inv.invitationId} style={{
                background: '#fff', borderRadius: 16, padding: 14,
                boxShadow: 'var(--shadow-card)',
                border: '1.5px solid rgba(198,93,61,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    letter={inv.inviter?.avatar_letter}
                    src={inv.inviter?.avatar_url}
                    color={inv.inviter?.color}
                    size={32}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      <b>{inv.inviter?.name ?? 'Quelqu\'un'}</b> t'invite
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                      {inv.annonce.when} · {inv.annonce.bar}
                    </div>
                  </div>
                  <VisibilityBadge visibility={inv.annonce.visibility || 'private'}/>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10, lineHeight: 1.3 }}>
                  {inv.annonce.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => declineInvitation(inv.invitationId)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    background: 'var(--paper)', color: 'var(--ink-soft)',
                    border: '1px solid var(--line)', fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>Refuser</button>
                  <button onClick={() => acceptInvitation(inv.invitationId)} style={{
                    flex: 2, padding: '10px 0', borderRadius: 10,
                    background: 'var(--terracotta)', color: '#fff',
                    border: 'none', fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>Accepter · Je viens</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {publics.slice(0, 5).map(raw => {
            const a = enrichAnnonce(raw)
            const participantCount = getParticipantCount(a.attending, (participantsMap[a.id] ?? []).length)
            const hasJoined = joinedAnnonceIds.has(a.id)
            const isFull = participantCount >= a.maxAttending
            const isCreator = authUser && a.user_id === authUser.id
            const canJoin = authUser && !hasJoined && !isFull && !isCreator
            const canUnjoin = authUser && hasJoined && !isCreator

            return (
              <div key={a.id} onClick={() => onOpenAnnonce(a)} style={{
                background: '#fff', borderRadius: 16, padding: 14,
                boxShadow: 'var(--shadow-card)',
                borderLeft: `3px solid ${a.color}`,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar letter={a.avatar} src={a.avatar_url} color={a.color} size={32}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      <b>{a.author}</b>{isCreator ? ' · Ta sortie' : ' propose'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{a.when} · {a.bar}</span>
                      {a.visibility && <VisibilityBadge visibility={a.visibility}/>}
                    </div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {(participantsMap[a.id] ?? []).slice(0, 3).map((p, i) => (
                      <Avatar key={p.user_id} letter={p.avatar_letter} src={p.avatar_url} color={p.color} size={22}
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
const BAR_COORDINATES = {
  ostal: { lat: 48.0240253, lng: -1.7473235 },
  pignom: { lat: 48.0290344, lng: -1.7619397 },
  'arriere-cour': { lat: 48.0217208, lng: -1.7501470 },
};
const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 14;
const MAX_ZOOM = 18;
const BRUZ_CENTER = { lat: 48.0249, lng: -1.7531 };
const MAP_FIT_FALLBACK_SIZE = { width: 360, height: 420 };
const MARKER_LABEL_PAD_X = 108;
const MAP_FIT_PAD_Y = 72;
const TABBAR_CLEARANCE = 92;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getCoordinates = bar => {
  const coords = bar.coordinates ?? BAR_COORDINATES[bar.id];
  if (!coords) return null;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};
const lngToTileX = (lng, zoom) => ((lng + 180) / 360) * TILE_SIZE * (2 ** zoom);
const latToTileY = (lat, zoom) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + (1 / Math.cos(rad))) / Math.PI) / 2) * TILE_SIZE * (2 ** zoom);
};
const tileXToLng = (x, zoom) => (x / (TILE_SIZE * (2 ** zoom))) * 360 - 180;
const tileYToLat = (y, zoom) => {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * (2 ** zoom));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};
const project = (coords, zoom) => ({ x: lngToTileX(coords.lng, zoom), y: latToTileY(coords.lat, zoom) });
const unproject = (point, zoom) => ({ lat: tileYToLat(point.y, zoom), lng: tileXToLng(point.x, zoom) });
const getMapPoints = bars => bars.map(getCoordinates).filter(Boolean);
const getFittedMapView = (bars, size = MAP_FIT_FALLBACK_SIZE) => {
  const points = getMapPoints(bars);
  if (points.length < 2) return { center: points[0] ?? BRUZ_CENTER, zoom: DEFAULT_ZOOM };

  const width = size.width || MAP_FIT_FALLBACK_SIZE.width;
  const height = size.height || MAP_FIT_FALLBACK_SIZE.height;
  const availableWidth = Math.max(120, width - MARKER_LABEL_PAD_X * 2);
  const availableHeight = Math.max(120, height - MAP_FIT_PAD_Y * 2);
  let zoom = MIN_ZOOM;

  for (let z = MAX_ZOOM; z >= MIN_ZOOM; z--) {
    const projected = points.map(p => project(p, z));
    const xs = projected.map(p => p.x);
    const ys = projected.map(p => p.y);
    if ((Math.max(...xs) - Math.min(...xs)) <= availableWidth && (Math.max(...ys) - Math.min(...ys)) <= availableHeight) {
      zoom = z;
      break;
    }
  }

  const fitted = points.map(p => project(p, zoom));
  const xs = fitted.map(p => p.x);
  const ys = fitted.map(p => p.y);
  return {
    center: unproject({
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    }, zoom),
    zoom,
  };
};

const MapView = ({ bars, onOpenBar }) => {
  const [selected, setSelected] = React.useState(null);
  const [view, setView] = React.useState(() => getFittedMapView(bars));
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const mapRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const now = useCurrentTime();
  const barStatus = bar => getBarStatus(bar, now);
  const sel = bars.find(b => b.id === selected);
  const mapHeight = sel ? 460 : 420;

  React.useEffect(() => {
    if (!mapRef.current) return;
    const updateSize = () => {
      const rect = mapRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    setView(getFittedMapView(bars, size));
  }, [bars, size.width, size.height]);

  const openMaps = (bar, e) => {
    e.stopPropagation();
    window.open(bar.mapsUrl, '_blank', 'noopener');
  };

  const resetView = e => {
    e.stopPropagation();
    setSelected(null);
    setView(getFittedMapView(bars, size));
  };

  const zoomMap = (delta, e) => {
    e.stopPropagation();
    setView(prev => ({ ...prev, zoom: clamp(prev.zoom + delta, MIN_ZOOM, MAX_ZOOM) }));
  };

  const handlePointerDown = e => {
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      centerPoint: project(view.center, view.zoom),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = e => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    setView(prev => ({
      ...prev,
      center: unproject({ x: drag.centerPoint.x - dx, y: drag.centerPoint.y - dy }, prev.zoom),
    }));
  };

  const handlePointerUp = e => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  const handleWheel = e => {
    e.preventDefault();
    setView(prev => ({ ...prev, zoom: clamp(prev.zoom + (e.deltaY > 0 ? -1 : 1), MIN_ZOOM, MAX_ZOOM) }));
  };

  const centerPoint = project(view.center, view.zoom);
  const topLeft = {
    x: centerPoint.x - (size.width || 0) / 2,
    y: centerPoint.y - (size.height || mapHeight) / 2,
  };
  const tileCount = 2 ** view.zoom;
  const tiles = [];
  const firstTileX = Math.floor(topLeft.x / TILE_SIZE) - 1;
  const lastTileX = Math.floor((topLeft.x + (size.width || 0)) / TILE_SIZE) + 1;
  const firstTileY = Math.max(0, Math.floor(topLeft.y / TILE_SIZE) - 1);
  const lastTileY = Math.min(tileCount - 1, Math.floor((topLeft.y + (size.height || mapHeight)) / TILE_SIZE) + 1);
  for (let x = firstTileX; x <= lastTileX; x++) {
    for (let y = firstTileY; y <= lastTileY; y++) {
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      tiles.push({ x, y, wrappedX });
    }
  }

  return (
    <div style={{ padding: '0 20px' }}>
      <div
        ref={mapRef}
        onClick={() => setSelected(null)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          borderRadius: 18,
          overflow: 'hidden',
          height: mapHeight,
          background: '#E8DFCE',
          boxShadow: 'var(--shadow-card)',
          transition: 'height 0.25s ease',
          touchAction: 'none',
          cursor: dragRef.current ? 'grabbing' : 'grab',
        }}
      >
        {tiles.map(tile => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${view.zoom}/${tile.wrappedX}/${tile.y}.png`}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: tile.x * TILE_SIZE - topLeft.x,
              top: tile.y * TILE_SIZE - topLeft.y,
              width: TILE_SIZE,
              height: TILE_SIZE,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ))}

        {bars.map(bar => {
          const coords = getCoordinates(bar);
          if (!coords) return null;
          const point = project(coords, view.zoom);
          const p = { x: point.x - topLeft.x, y: point.y - topLeft.y };
          const isSel = selected === bar.id;
          const status = barStatus(bar);
          const bubbleWidth = Math.min(216, Math.max(180, (size.width || 260) - 24));
          const bubbleLeft = clamp(p.x - bubbleWidth / 2, 10, Math.max(10, (size.width || 260) - bubbleWidth - 10));
          const bubbleAbove = p.y > 118;
          const bubbleTop = bubbleAbove ? p.y - 116 : p.y + 18;
          const pointerLeft = clamp(p.x - bubbleLeft, 14, bubbleWidth - 14);

          return (
            <React.Fragment key={bar.id}>
              {isSel && (
                <div
                  onClick={e => openMaps(bar, e)}
                  style={{
                    position: 'absolute',
                    left: bubbleLeft,
                    top: bubbleTop,
                    width: bubbleWidth,
                    background: '#fff',
                    borderRadius: 12,
                    padding: '10px 12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    zIndex: 30,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                    {bar.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-mute)', marginBottom: 7 }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: status.openNow ? 'var(--success)' : 'var(--ink-mute)',
                    }}/>
                    {status.openNow ? `Ouvert · ferme à ${status.closesAt}` : `Fermé · ${status.opensIn}`}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    background: bar.color,
                    color: '#fff',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    <Icon name="pin" size={11} color="#fff"/>
                    Ouvrir dans Maps
                  </div>
                  <div style={{
                    position: 'absolute',
                    [bubbleAbove ? 'bottom' : 'top']: -6,
                    left: pointerLeft,
                    transform: bubbleAbove ? 'translateX(-50%)' : 'translateX(-50%) rotate(180deg)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #fff',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                  }}/>
                </div>
              )}

              <div
                onClick={e => {
                  e.stopPropagation();
                  setSelected(isSel ? null : bar.id);
                }}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  transform: `translate(-50%, -100%) scale(${isSel ? 1.08 : 1})`,
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                  zIndex: isSel ? 25 : 10,
                }}
              >
                <div style={{
                  background: bar.color,
                  color: '#fff',
                  padding: '7px 11px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: isSel ? `0 4px 16px ${bar.color}66` : '0 3px 10px rgba(0,0,0,0.18)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: isSel ? '2px solid #fff' : '2px solid transparent',
                  transition: 'box-shadow 0.2s, border 0.2s',
                }}>
                  <Icon name={BAR_ICONS[bar.id]} size={13} color="#fff"/>
                  {bar.name}
                </div>
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `7px solid ${bar.color}`,
                  margin: '0 auto',
                }}/>
              </div>
            </React.Fragment>
          );
        })}

        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <button onClick={e => zoomMap(1, e)} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(42,31,23,0.12)',
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--ink)',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}>+</button>
          <button onClick={e => zoomMap(-1, e)} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(42,31,23,0.12)',
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--ink)',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}>-</button>
          <button onClick={resetView} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(42,31,23,0.12)',
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            color: 'var(--ink)',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name="map" size={15}/>
          </button>
        </div>

        {sel && (
          <div
            onClick={e => {
              e.stopPropagation();
              onOpenBar(sel.id);
            }}
            style={{
              position: 'absolute',
              bottom: TABBAR_CLEARANCE,
              left: 12,
              right: 12,
              background: '#fff',
              borderRadius: 14,
              padding: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              boxShadow: 'var(--shadow-float)',
              cursor: 'pointer',
              animation: 'fadeUp 0.2s ease',
              zIndex: 32,
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${sel.color}, ${sel.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name={BAR_ICONS[sel.id]} size={20} color="#fff"/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sel.address}
              </div>
            </div>
            <button onClick={e => openMaps(sel, e)} style={{
              background: sel.color,
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}>
              <Icon name="pin" size={11} color="#fff"/>
              Maps
            </button>
          </div>
        )}

        <div style={{
          position: 'absolute',
          left: 8,
          bottom: sel ? TABBAR_CLEARANCE + 72 : 8,
          zIndex: 8,
          fontSize: 9,
          color: 'rgba(42,31,23,0.65)',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 6,
          padding: '3px 5px',
          pointerEvents: 'none',
        }}>
          © OpenStreetMap
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-mute)' }}>
        Déplacez la carte, zoomez, puis appuyez sur un marqueur.
      </div>
    </div>
  );
};

export { HomeScreen, DiscoverScreen, MapView, SortieDetailSheet };
