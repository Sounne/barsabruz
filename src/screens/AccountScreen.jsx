import React from 'react'
import { Icon, Avatar, BarHero, shade, Wip } from '../components/ui'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../services'

// ─────────── EDIT PROFILE SHEET ───────────
const EditProfileSheet = ({ user, onSave, onClose }) => {
  const [name, setName] = React.useState(user.name)
  const [handle, setHandle] = React.useState(user.handle)
  const [bio, setBio] = React.useState(user.bio || '')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid var(--line)', borderRadius: 12,
    fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const handleSaveClick = async () => {
    if (!name.trim()) { setError('Le prénom est requis.'); return }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        avatar_letter: name.trim()[0]?.toUpperCase() || 'E',
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(42,31,23,0.45)',
        zIndex: 80, animation: 'fadeIn 0.15s ease',
      }}/>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--paper)', borderRadius: '24px 24px 0 0',
        padding: '0 20px 40px', zIndex: 90,
        maxWidth: 520, margin: '0 auto',
        animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -8px 40px rgba(42,31,23,0.14)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--line-strong)' }}/>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Modifier le profil</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
            <Icon name="close" size={20} color="var(--ink-mute)"/>
          </button>
        </div>

        {/* Avatar preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar letter={name[0]?.toUpperCase() || 'E'} color={user.color} size={80} ring/>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--terracotta)', border: '2px solid var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={13} color="#fff"/>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Prénom
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--terracotta)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Identifiant
            </label>
            <input
              value={handle} onChange={e => setHandle(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--terracotta)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Bio
            </label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = 'var(--terracotta)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '9px 13px',
            background: 'rgba(198,93,61,0.08)', border: '1px solid rgba(198,93,61,0.25)',
            borderRadius: 10, fontSize: 13, color: 'var(--terracotta)', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <button onClick={handleSaveClick} disabled={saving} style={{
          marginTop: 20, width: '100%', padding: 14,
          background: saving ? 'var(--line-strong)' : 'var(--terracotta)', color: '#fff',
          border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer',
          boxShadow: saving ? 'none' : '0 4px 14px rgba(198,93,61,0.35)',
        }}>
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </button>
      </div>
    </>
  )
}

// ─────────── FAVORITE BAR CARD ───────────
const FavBarCard = ({ bar, onOpen }) => (
  <div onClick={() => onOpen(bar.id)}
    style={{
      flex: '0 0 170px', borderRadius: 16, overflow: 'hidden',
      boxShadow: 'var(--shadow-card)', cursor: 'pointer', position: 'relative',
    }}>
    <BarHero bar={bar} height={110} small/>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 40%, transparent 100%)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 10px 10px',
    }}>
      <div className="serif" style={{ color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{bar.name}</div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>{bar.tagline.split(' · ')[0]}</div>
    </div>
    <div style={{
      position: 'absolute', top: 8, right: 8,
      width: 26, height: 26, borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.3)',
    }}>
      <Icon name="heart" size={13} color="#fff" stroke={2}/>
    </div>
  </div>
)

// ─────────── SORTIE ROW ───────────
const SortieRow = ({ sortie, bar, onOpen }) => (
  <div onClick={() => onOpen?.(bar?.id)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      cursor: bar ? 'pointer' : 'default',
    }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, alignSelf: 'stretch', paddingTop: 2 }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: bar?.color || 'var(--terracotta)',
        boxShadow: `0 0 0 3px ${bar ? bar.color + '28' : 'rgba(198,93,61,0.16)'}`,
      }}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {sortie.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 500 }}>{sortie.bar}</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-mute)', flexShrink: 0 }}/>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{sortie.date} · {sortie.time}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-mute)', flexShrink: 0 }}>
      <Icon name="users" size={11}/>
      <span>{sortie.with}</span>
    </div>
  </div>
)

// ─────────── ANNONCE CARD (for Mes annonces / Mes sorties) ───────────
const AnnonceCard = ({ annonce: a, onOpen, badge }) => (
  <div onClick={() => onOpen?.(a)} style={{
    background: '#fff', borderRadius: 14, padding: 14,
    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
    borderLeft: `3px solid ${a.color || 'var(--terracotta)'}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: badge.color, background: badge.bg,
          padding: '2px 7px', borderRadius: 4,
        }}>{badge.label}</span>
      )}
      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{a.bar}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{a.title}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{a.when}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
        <Icon name="users" size={12}/> {a.attending}
      </div>
    </div>
  </div>
)

// ─────────── ACCOUNT SCREEN ───────────
const AccountScreen = ({ onOpenAnnonce, onOpenBar }) => {
  const { user, bars, annonces, saveProfile, joinedAnnonceIds, myGroups, friends } = useData()
  const { user: authUser } = useAuth()
  const [editing, setEditing] = React.useState(false)
  const [sortiesExpanded, setSortiesExpanded] = React.useState(false)
  const [annoncesExpanded, setAnnoncesExpanded] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)

  const favBars = bars.filter(b => user.favorites.includes(b.id))

  // Mes annonces = sorties I created
  const mesAnnonces = authUser
    ? annonces.filter(a => a.user_id === authUser.id)
    : []

  // Mes sorties = sorties I joined (but didn't create)
  const mesSorties = authUser
    ? annonces.filter(a => joinedAnnonceIds.has(a.id) && a.user_id !== authUser.id)
    : []

  const displayedAnnonces = annoncesExpanded ? mesAnnonces : mesAnnonces.slice(0, 2)
  const displayedSorties = sortiesExpanded ? mesSorties : mesSorties.slice(0, 2)

  const handleSave = async (updates) => {
    await saveProfile(updates)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Banner */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${user.color}, ${shade(user.color, 20)})`,
        position: 'relative', overflow: 'hidden',
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

      {/* Profile card */}
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
          <button onClick={() => setEditing(true)} style={{
            background: '#fff', border: '1px solid var(--line)',
            padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>Modifier</button>
        </div>

        {user.bio && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            {user.bio}
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          {[
            { n: mesAnnonces.length + mesSorties.length, l: 'Sorties' },
            { n: myGroups.length, l: 'Groupes' },
            { n: friends.length, l: 'Amis' },
          ].map(s => (
            <div key={s.l}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bars favoris */}
      {favBars.length > 0 && (
        <Wip>
        <div style={{ padding: '22px 0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 20px', marginBottom: 12 }}>
            <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Bars favoris</h2>
            <span style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 600 }}>{favBars.length} bar{favBars.length > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollSnapType: 'x mandatory' }} className="noscroll">
            {favBars.map(bar => (
              <FavBarCard key={bar.id} bar={bar} onOpen={onOpenBar}/>
            ))}
            <div onClick={() => {}} style={{
              flex: '0 0 80px', borderRadius: 16, border: '1.5px dashed var(--line-strong)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: 'pointer', minHeight: 110, color: 'var(--ink-mute)',
            }}>
              <Icon name="plus" size={18} color="var(--ink-mute)"/>
              <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>Ajouter</span>
            </div>
          </div>
        </div>
        </Wip>
      )}

      {/* Mes annonces (sorties créées) */}
      {authUser && (
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Mes sorties proposées</h2>
            {mesAnnonces.length > 0 && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{mesAnnonces.length} au total</span>}
          </div>
          {mesAnnonces.length === 0 ? (
            <div style={{
              padding: 18, borderRadius: 14, textAlign: 'center',
              background: 'rgba(198,93,61,0.04)', border: '1px dashed rgba(198,93,61,0.2)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Tu n'as pas encore proposé de sortie</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayedAnnonces.map(a => (
                <AnnonceCard key={a.id} annonce={a} onOpen={onOpenAnnonce}
                  badge={{ label: `${a.attending} participant${a.attending !== 1 ? 's' : ''}`, color: 'var(--terracotta)', bg: 'rgba(198,93,61,0.08)' }}
                />
              ))}
              {mesAnnonces.length > 2 && (
                <button onClick={() => setAnnoncesExpanded(e => !e)} style={{
                  background: 'none', border: 'none', padding: '8px 0',
                  fontSize: 12, fontWeight: 600, color: 'var(--terracotta)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                }}>
                  {annoncesExpanded ? 'Voir moins' : `Voir tout (${mesAnnonces.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mes sorties rejointes */}
      {authUser && (
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Sorties rejointes</h2>
            {mesSorties.length > 0 && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{mesSorties.length} au total</span>}
          </div>
          {mesSorties.length === 0 ? (
            <div style={{
              padding: 18, borderRadius: 14, textAlign: 'center',
              background: 'rgba(42,31,23,0.03)', border: '1px dashed var(--line-strong)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Tu n'as rejoint aucune sortie pour l'instant</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayedSorties.map(a => (
                <AnnonceCard key={a.id} annonce={a} onOpen={onOpenAnnonce}
                  badge={{ label: 'Je viens', color: '#4A7C59', bg: '#4A7C5912' }}
                />
              ))}
              {mesSorties.length > 2 && (
                <button onClick={() => setSortiesExpanded(e => !e)} style={{
                  background: 'none', border: 'none', padding: '8px 0',
                  fontSize: 12, fontWeight: 600, color: 'var(--terracotta)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                }}>
                  {sortiesExpanded ? 'Voir moins' : `Voir tout (${mesSorties.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Paramètres */}
      <Wip>
      <div style={{ padding: '14px 20px 10px' }}>
        <h2 className="serif" style={{ fontSize: 18, margin: '0 0 10px', fontWeight: 600 }}>Paramètres</h2>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          {[
            { icon: 'bell', label: 'Notifications', detail: 'Actives' },
            { icon: 'heart', label: 'Bars favoris', detail: String(favBars.length) },
            { icon: 'users', label: 'Mes amis', detail: String(friends.length) },
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
      </Wip>

      <div style={{ padding: '18px 20px' }}>
        <button onClick={handleSignOut} disabled={signingOut} style={{
          width: '100%', background: 'transparent', color: 'var(--ink-mute)',
          border: '1px solid var(--line)', padding: 13, borderRadius: 12,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          cursor: signingOut ? 'default' : 'pointer',
          opacity: signingOut ? 0.6 : 1,
        }}>
          {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)', marginTop: 18 }}>
          Bars à Bruz · v1.0 · Fait par Enzo
        </div>
      </div>

      {/* Edit profile sheet */}
      {editing && (
        <EditProfileSheet user={user} onSave={handleSave} onClose={() => setEditing(false)}/>
      )}
    </div>
  )
}

export { AccountScreen }
