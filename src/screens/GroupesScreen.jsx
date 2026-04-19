import React from 'react'
import { Icon, Avatar } from '../components/ui'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import * as chatApi from '../lib/chatApi'
import { createAnnonce } from '../services'

// ─── Time formatter ──────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ═══════════════ GROUP ROW ═══════════════

const GroupRow = ({ group, onOpen, onJoin, joining }) => {
  const isJoining = joining === group.id
  const visibilityColor = { friends: '#4A7C59', public: '#3A6AB0' }
  const visibilityLabel = { friends: 'Amis', public: 'Public' }

  return (
    <div
      onClick={() => group.isMember && onOpen(group)}
      style={{
        background: '#fff', borderRadius: 16, padding: 14,
        display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: 'var(--shadow-card)',
        cursor: group.isMember ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: group.type === 'ephemeral'
          ? 'linear-gradient(135deg, #D9A44A, #E89579)'
          : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>{group.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{group.name}</span>
          {group.type === 'ephemeral' && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              color: 'var(--ochre-deep)', background: 'rgba(217,164,74,0.15)',
              padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
            }}>Éphémère</span>
          )}
          {visibilityLabel[group.visibility] && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              color: visibilityColor[group.visibility],
              background: `${visibilityColor[group.visibility]}1a`,
              padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
            }}>{visibilityLabel[group.visibility]}</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {group.isMember
            ? (group.lastMsg || 'Aucun message')
            : `${group.members} membre${group.members !== 1 ? 's' : ''}`}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {group.isMember ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{group.time}</div>
            {group.unread > 0 && (
              <div style={{
                background: 'var(--terracotta)', color: '#fff',
                fontSize: 11, fontWeight: 600, borderRadius: 999,
                padding: '2px 7px', marginTop: 4, display: 'inline-block',
              }}>{group.unread}</div>
            )}
          </>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(group) }}
            disabled={isJoining}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: isJoining ? 'var(--line)' : 'var(--terracotta)',
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              cursor: isJoining ? 'default' : 'pointer',
            }}
          >
            {isJoining ? '…' : 'Rejoindre'}
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════ GROUPES SCREEN ═══════════════

const GroupesScreen = ({ onOpenGroup, onOpenDM, onNew, refreshKey = 0 }) => {
  const { user: authUser } = useAuth()
  const [mainTab, setMainTab] = React.useState('groupes')
  const [groupFilter, setGroupFilter] = React.useState('all')
  const [groups, setGroups] = React.useState(null)
  const [joining, setJoining] = React.useState(null)

  // Friends
  const [friends, setFriends] = React.useState([])
  const [pending, setPending] = React.useState([])
  const [friendsLoading, setFriendsLoading] = React.useState(false)

  // Search
  const [showSearch, setShowSearch] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState([])
  const [searching, setSearching] = React.useState(false)
  const [addedIds, setAddedIds] = React.useState(new Set())

  React.useEffect(() => {
    if (!authUser) { setGroups([]); return }
    chatApi.getAccessibleGroups(authUser.id)
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [authUser?.id, refreshKey])

  React.useEffect(() => {
    if (!authUser) return
    setFriendsLoading(true)
    Promise.all([chatApi.getFriends(authUser.id), chatApi.getPendingRequests(authUser.id)])
      .then(([f, p]) => { setFriends(f); setPending(p) })
      .catch(() => {})
      .finally(() => setFriendsLoading(false))
  }, [authUser?.id])

  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const t = setTimeout(() =>
      chatApi.searchUsers(searchQuery)
        .then(r => setSearchResults(r.filter(u => u.id !== authUser?.id)))
        .catch(() => {})
        .finally(() => setSearching(false))
    , 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleAddFriend = async (userId) => {
    if (!authUser) return
    try {
      await chatApi.sendFriendRequest(authUser.id, userId)
      setAddedIds(prev => new Set([...prev, userId]))
    } catch {}
  }

  const [removingFriend, setRemovingFriend] = React.useState(null)

  const handleRemoveFriend = async () => {
    if (!removingFriend) return
    try {
      await chatApi.removeFriend(removingFriend.friendshipId)
      setFriends(prev => prev.filter(f => f.friendshipId !== removingFriend.friendshipId))
    } catch {}
    setRemovingFriend(null)
  }

  const handleRespond = async (requestId, status) => {
    try {
      await chatApi.respondFriendRequest(requestId, status)
      setPending(prev => prev.filter(r => r.requestId !== requestId))
      if (status === 'accepted' && authUser) {
        chatApi.getFriends(authUser.id).then(setFriends).catch(() => {})
      }
    } catch {}
  }

  const handleJoin = async (group) => {
    if (!authUser) return
    setJoining(group.id)
    try {
      await chatApi.joinGroup(group.id, authUser.id)
      const joined = { ...group, isMember: true }
      setGroups(prev => (prev ?? []).map(g => g.id === group.id ? joined : g))
      onOpenGroup(joined)
    } catch (err) {
      console.error(err)
    } finally {
      setJoining(null)
    }
  }

  const myGroups = (groups ?? []).filter(g => g.isMember)
  const discoverGroups = (groups ?? []).filter(g => !g.isMember)
  const filteredMine = groupFilter === 'all' ? myGroups : myGroups.filter(g => g.type === groupFilter)

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>Social</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {mainTab === 'amis' && (
            <button onClick={() => { setShowSearch(s => !s); setSearchQuery('') }} style={{
              width: 42, height: 42, borderRadius: '50%',
              background: showSearch ? 'var(--ink)' : '#fff',
              border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}>
              <Icon name="search" size={20} color={showSearch ? '#fff' : 'var(--ink)'}/>
            </button>
          )}
          {mainTab === 'groupes' && authUser && (
            <button onClick={onNew} style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'var(--terracotta)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}>
              <Icon name="plus" size={22} color="#fff"/>
            </button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {[
          { id: 'groupes', label: 'Groupes' },
          { id: 'amis', label: pending.length ? `Amis · ${pending.length}` : 'Amis' },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)} style={{
            padding: '8px 20px', borderRadius: 999,
            background: mainTab === t.id ? 'var(--ink)' : '#fff',
            color: mainTab === t.id ? '#fff' : 'var(--ink-soft)',
            border: mainTab === t.id ? 'none' : '1px solid var(--line)',
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {mainTab === 'groupes' ? (
        <>
          {/* Group filter */}
          <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
            {[{ id: 'all', label: 'Tous' }, { id: 'permanent', label: 'Permanents' }, { id: 'ephemeral', label: 'Éphémères' }].map(t => (
              <button key={t.id} onClick={() => setGroupFilter(t.id)} style={{
                padding: '7px 14px', borderRadius: 999,
                background: groupFilter === t.id ? 'var(--terracotta)' : '#fff',
                color: groupFilter === t.id ? '#fff' : 'var(--ink-soft)',
                border: groupFilter === t.id ? 'none' : '1px solid var(--line)',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Not logged in */}
            {!authUser && (
              <div style={{
                padding: 28, borderRadius: 16, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(198,93,61,0.06), rgba(217,164,74,0.06))',
                border: '1px dashed rgba(198,93,61,0.25)',
              }}>
                <div style={{ fontSize: 32 }}>🔒</div>
                <div className="serif" style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>Connecte-toi</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Pour voir et créer des groupes</div>
              </div>
            )}

            {/* Loading */}
            {authUser && groups === null && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>Chargement…</div>
            )}

            {/* My groups */}
            {filteredMine.map(g => (
              <GroupRow key={g.id} group={g} onOpen={onOpenGroup} onJoin={handleJoin} joining={joining}/>
            ))}

            {/* Empty own groups */}
            {authUser && groups !== null && myGroups.length === 0 && (
              <div style={{
                padding: 24, borderRadius: 16, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(198,93,61,0.06), rgba(217,164,74,0.06))',
                border: '1px dashed rgba(198,93,61,0.25)',
              }}>
                <div style={{ fontSize: 28 }}>💬</div>
                <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Pas encore de groupe</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Crée ton premier groupe ci-dessous</div>
              </div>
            )}

            {/* Discover section */}
            {discoverGroups.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', fontWeight: 600, marginTop: 8,
                }}>Découverte</div>
                {discoverGroups.map(g => (
                  <GroupRow key={g.id} group={g} onOpen={onOpenGroup} onJoin={handleJoin} joining={joining}/>
                ))}
              </>
            )}

            {/* Create group CTA */}
            {authUser && (
              <div onClick={onNew} style={{
                marginTop: 14, padding: 18, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(198,93,61,0.08), rgba(217,164,74,0.08))',
                border: '1px dashed rgba(198,93,61,0.3)', textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 26 }}>🎉</div>
                <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>Organise une soirée</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Crée un groupe et invite tes amis</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search panel */}
          {showSearch && (
            <div>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: '#fff', borderRadius: 12, padding: '8px 14px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <Icon name="search" size={16} color="var(--ink-mute)"/>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Chercher un utilisateur…" autoFocus
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', fontFamily: 'inherit', padding: '6px 0' }}/>
              </div>
              {searching && <div style={{ padding: '8px 4px', fontSize: 13, color: 'var(--ink-mute)' }}>Recherche…</div>}
              {searchResults.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchResults.map(u => (
                    <div key={u.id} style={{
                      background: '#fff', borderRadius: 12, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: 'var(--shadow-card)',
                    }}>
                      <Avatar letter={u.avatar_letter} src={u.avatar_url} color={u.color} size={36}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{u.handle}</div>
                      </div>
                      <button onClick={() => handleAddFriend(u.id)} disabled={addedIds.has(u.id)} style={{
                        padding: '6px 14px', borderRadius: 8,
                        background: addedIds.has(u.id) ? 'var(--line)' : 'var(--terracotta)',
                        color: '#fff', border: 'none',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        cursor: addedIds.has(u.id) ? 'default' : 'pointer',
                      }}>
                        {addedIds.has(u.id) ? 'Envoyé ✓' : '+ Ajouter'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending requests */}
          {pending.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 4 }}>
                Demandes d'ami ({pending.length})
              </div>
              {pending.map(req => (
                <div key={req.requestId} style={{
                  background: '#fff', borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid rgba(198,93,61,0.2)',
                }}>
                  <Avatar letter={req.avatar_letter} src={req.avatar_url} color={req.color} size={40}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{req.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{req.handle}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleRespond(req.requestId, 'accepted')} style={{
                      padding: '7px 14px', borderRadius: 8,
                      background: 'var(--terracotta)', color: '#fff',
                      border: 'none', fontSize: 13, fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}>Accepter</button>
                    <button onClick={() => handleRespond(req.requestId, 'declined')} style={{
                      padding: '7px 12px', borderRadius: 8,
                      background: 'var(--paper)', color: 'var(--ink-soft)',
                      border: '1px solid var(--line)',
                      fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Friends list */}
          {!authUser ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
              Connecte-toi pour voir tes amis
            </div>
          ) : friendsLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>Chargement…</div>
          ) : friends.length === 0 ? (
            <div style={{
              padding: 24, borderRadius: 16, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(198,93,61,0.06), rgba(217,164,74,0.06))',
              border: '1px dashed rgba(198,93,61,0.25)',
            }}>
              <div style={{ fontSize: 28 }}>👋</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Pas encore d'amis</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Utilise la recherche pour en ajouter</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 4 }}>
                Amis ({friends.length})
              </div>
              {friends.map(friend => (
                <div key={friend.id} onClick={() => onOpenDM(friend)} style={{
                  background: '#fff', borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                }}>
                  <Avatar letter={friend.avatar_letter} src={friend.avatar_url} color={friend.color} size={40}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{friend.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{friend.handle}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(198,93,61,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="send" size={15} color="var(--terracotta)"/>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setRemovingFriend(friend) }} style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(100,100,100,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                      <Icon name="trash" size={15} color="var(--ink-mute)"/>
                    </div>
                  </div>
                </div>
              ))}

              {removingFriend && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 200,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 24,
                }} onClick={() => setRemovingFriend(null)}>
                  <div onClick={e => e.stopPropagation()} style={{
                    background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Retirer {removingFriend.name} ?</div>
                    <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, marginBottom: 24 }}>
                      Cette personne ne sera plus dans ta liste d'amis.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setRemovingFriend(null)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 12,
                        background: 'var(--paper)', color: 'var(--ink)',
                        border: '1px solid var(--line)', fontSize: 14, fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}>Annuler</button>
                      <button onClick={handleRemoveFriend} style={{
                        flex: 1, padding: '12px 0', borderRadius: 12,
                        background: 'var(--terracotta)', color: '#fff',
                        border: 'none', fontSize: 14, fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}>Retirer</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════ SHARED CHAT INPUT ═══════════════

const ChatInput = ({ value, onChange, onSend, sending }) => (
  <div style={{ padding: '10px 14px 14px', background: '#fff', borderTop: '1px solid var(--line)' }}>
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      background: 'var(--paper)', borderRadius: 999, padding: '6px 6px 6px 16px',
    }}>
      <input value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !sending && onSend()}
        placeholder="Message…"
        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', fontFamily: 'inherit', padding: '8px 0' }}/>
      <button onClick={onSend} disabled={sending || !value.trim()} style={{
        width: 36, height: 36, borderRadius: '50%',
        background: value.trim() ? 'var(--terracotta)' : 'var(--line)',
        color: '#fff', border: 'none',
        cursor: value.trim() ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        <Icon name="send" size={16} color="#fff"/>
      </button>
    </div>
  </div>
)

// ═══════════════ GROUP CHAT SCREEN ═══════════════

const GroupChatScreen = ({ group, onBack, onDelete }) => {
  const { user: authUser } = useAuth()
  const [messages, setMessages] = React.useState(null)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const bottomRef = React.useRef(null)

  const isCreator = authUser?.id === group.created_by

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await chatApi.deleteGroup(group.id)
      onDelete?.()
      onBack()
    } catch (err) {
      console.error(err)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  React.useEffect(() => {
    if (!authUser) return
    chatApi.getGroupMessages(group.id)
      .then(setMessages)
      .catch(() => setMessages([]))
  }, [group.id, authUser?.id])

  React.useEffect(() => {
    if (!authUser) return
    const ch = chatApi.subscribeToGroupMessages(group.id, () => {
      chatApi.getGroupMessages(group.id).then(setMessages).catch(() => {})
    })
    return () => chatApi.unsubscribe(ch)
  }, [group.id, authUser?.id])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const send = async () => {
    if (!input.trim() || !authUser) return
    setSending(true)
    try {
      const msg = await chatApi.sendGroupMessage(group.id, authUser.id, input.trim())
      setMessages(prev => [...(prev ?? []), msg])
      setInput('')
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const visibilityLabel = { private: 'Privé', friends: 'Ouvert aux amis', public: 'Public' }[group.visibility] || 'Privé'

  if (!authUser) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 54, left: 16, background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
        <div style={{ fontSize: 32 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Connecte-toi</div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Pour accéder aux groupes</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: group.type === 'ephemeral' ? 'linear-gradient(135deg, #D9A44A, #E89579)' : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>{group.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{group.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={10}/> {visibilityLabel} · {group.members} membre{group.members !== 1 ? 's' : ''}
          </div>
        </div>
        {isCreator && (
          <button onClick={() => setConfirmDelete(true)} style={{
            background: 'none', border: 'none', padding: 6,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <Icon name="trash" size={20} color="var(--ink-soft)"/>
          </button>
        )}
      </div>

      {confirmDelete && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Supprimer le groupe ?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, marginBottom: 24 }}>
              Cette action est irréversible. Tous les messages seront définitivement supprimés.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'var(--paper)', color: 'var(--ink)',
                border: '1px solid var(--line)', fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'var(--terracotta)', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', cursor: deleting ? 'default' : 'pointer',
              }}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {group.type === 'ephemeral' && (
          <div style={{
            alignSelf: 'center', padding: '8px 14px', borderRadius: 999,
            background: 'rgba(217,164,74,0.15)', color: 'var(--ochre-deep)',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="clock" size={12} color="var(--ochre-deep)"/>
            Groupe éphémère · disparaît dans {group.expiresIn}
          </div>
        )}
        {messages === null && (
          <div style={{ alignSelf: 'center', color: 'var(--ink-mute)', fontSize: 13, marginTop: 20 }}>Chargement…</div>
        )}
        {messages?.length === 0 && (
          <div style={{ alignSelf: 'center', color: 'var(--ink-mute)', fontSize: 13, marginTop: 20 }}>
            Aucun message · soyez les premiers ! 👋
          </div>
        )}
        {(messages ?? []).map(m => {
          const isMe = m.sender?.id === authUser?.id
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isMe && <Avatar letter={m.sender?.avatar_letter} src={m.sender?.avatar_url} color={m.sender?.color} size={28}/>}
              <div style={{ maxWidth: '75%' }}>
                {!isMe && <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 3, fontWeight: 500 }}>{m.sender?.name}</div>}
                <div style={{
                  padding: '9px 13px',
                  background: isMe ? 'var(--terracotta)' : '#fff',
                  color: isMe ? '#fff' : 'var(--ink)',
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  fontSize: 14, lineHeight: 1.35,
                  boxShadow: isMe ? 'none' : '0 1px 2px rgba(42,31,23,0.05)',
                }}>
                  {m.text}
                  {m.shared_event && (
                    <div style={{
                      marginTop: 8, borderRadius: 10, padding: 10,
                      background: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(198,93,61,0.08)',
                      border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(198,93,61,0.15)',
                    }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.75 }}>📅 Événement partagé</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{m.shared_event.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{m.shared_event.bar} · {m.shared_event.when}</div>
                    </div>
                  )}
                </div>
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {Object.keys(m.reactions).map((r, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '2px 7px', borderRadius: 999, background: '#fff', boxShadow: 'var(--shadow-card)' }}>{r}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      <ChatInput value={input} onChange={setInput} onSend={send} sending={sending}/>
    </div>
  )
}

// ═══════════════ DM CHAT SCREEN ═══════════════

const DMChatScreen = ({ friend, onBack }) => {
  const { user: authUser } = useAuth()
  const [messages, setMessages] = React.useState([])
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const bottomRef = React.useRef(null)

  React.useEffect(() => {
    if (!authUser) return
    chatApi.getDirectMessages(authUser.id, friend.id)
      .then(setMessages)
      .catch(console.error)
  }, [authUser?.id, friend.id])

  React.useEffect(() => {
    if (!authUser) return
    const ch = chatApi.subscribeToDirectMessages(authUser.id, friend.id, msg => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    })
    return () => chatApi.unsubscribe(ch)
  }, [authUser?.id, friend.id])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    if (!input.trim() || !authUser) return
    setSending(true)
    try {
      const msg = await chatApi.sendDirectMessage(authUser.id, friend.id, input.trim())
      setMessages(prev => [...prev, msg])
      setInput('')
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
        <Avatar letter={friend.avatar_letter} src={friend.avatar_url} color={friend.color} size={40}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{friend.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{friend.handle}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ alignSelf: 'center', color: 'var(--ink-mute)', fontSize: 13, marginTop: 20 }}>
            Dis bonjour à {friend.name} 👋
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === authUser?.id
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isMe && <Avatar letter={friend.avatar_letter} src={friend.avatar_url} color={friend.color} size={28}/>}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  padding: '9px 13px',
                  background: isMe ? 'var(--terracotta)' : '#fff',
                  color: isMe ? '#fff' : 'var(--ink)',
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  fontSize: 14, lineHeight: 1.35,
                  boxShadow: isMe ? 'none' : '0 1px 2px rgba(42,31,23,0.05)',
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      <ChatInput value={input} onChange={setInput} onSend={send} sending={sending}/>
    </div>
  )
}

// ═══════════════ NEW ANNONCE SHEET ═══════════════

const TYPE_EMOJIS = { soirée: '🍻', anniv: '🎂', after: '💼', match: '⚽' }

const NewAnnonceSheet = ({ onClose, onGroupCreated }) => {
  const { bars: BARS_DATA } = useData()
  const { user: authUser } = useAuth()
  const [type, setType] = React.useState('soirée')
  const [privacy, setPrivacy] = React.useState('private')
  const [bar, setBar] = React.useState('ostal')
  const [title, setTitle] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const handlePublish = async () => {
    if (!authUser || !title.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await chatApi.createGroupChat(
        title.trim(),
        TYPE_EMOJIS[type] || '💬',
        'permanent',
        authUser.id,
        [],
        null,
        privacy
      )
      onGroupCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Une erreur est survenue. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  const canPublish = authUser && title.trim() && !submitting

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--paper)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '90%', overflow: 'auto',
        animation: 'slideUp 0.25s',
      }}>
        <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Nouveau groupe</div>
          <button onClick={handlePublish} disabled={!canPublish} style={{
            fontSize: 14, fontWeight: 600,
            color: canPublish ? 'var(--terracotta)' : 'var(--ink-mute)',
            background: 'none', border: 'none',
            cursor: canPublish ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>
            {submitting ? '…' : 'Créer'}
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>Organise une sortie</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>Crée un groupe pour coordonner la soirée.</div>

          {!authUser && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(198,93,61,0.08)', textAlign: 'center', fontSize: 14, color: 'var(--ink-soft)' }}>
              Connecte-toi pour créer un groupe
            </div>
          )}

          {/* Type */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'soirée', label: 'Apéro / soirée', icon: 'cocktail' },
                { id: 'anniv', label: 'Anniversaire', icon: 'cake' },
                { id: 'after', label: 'Afterwork', icon: 'beer' },
                { id: 'match', label: 'Match', icon: 'flame' },
              ].map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: type === t.id ? 'var(--ink)' : '#fff',
                  color: type === t.id ? '#fff' : 'var(--ink)',
                  border: type === t.id ? 'none' : '1px solid var(--line)',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={t.icon} size={15} color={type === t.id ? '#fff' : 'var(--ink-soft)'}/>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Titre</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex. Anniv de Théo 🎂"
              style={{ width: '100%', background: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxShadow: 'var(--shadow-card)', boxSizing: 'border-box' }}
            />
          </div>

          {/* Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Bar</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {BARS_DATA.map(b => (
                <button key={b.id} onClick={() => setBar(b.id)} style={{
                  flex: 1, padding: 10, borderRadius: 12,
                  background: bar === b.id ? b.color : '#fff',
                  color: bar === b.id ? '#fff' : 'var(--ink)',
                  border: bar === b.id ? 'none' : '1px solid var(--line)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={{ ostal: 'wine', pignom: 'beer', 'arriere-cour': 'cocktail' }[b.id]} size={18} color={bar === b.id ? '#fff' : b.color}/>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Visibilité</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'private', label: 'Groupe privé', icon: 'lock', sub: 'Seulement les membres invités' },
                { id: 'friends', label: 'Ouvert aux amis', icon: 'users', sub: 'Visible par tes amis, qui peuvent rejoindre' },
                { id: 'public', label: 'Ouvert à tous', icon: 'globe', sub: 'Visible par tous les utilisateurs' },
              ].map(p => (
                <button key={p.id} onClick={() => setPrivacy(p.id)} style={{
                  padding: 12, borderRadius: 12, textAlign: 'left',
                  background: privacy === p.id ? 'rgba(198,93,61,0.08)' : '#fff',
                  border: privacy === p.id ? '2px solid var(--terracotta)' : '1px solid var(--line)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <Icon name={p.icon} size={18} color={privacy === p.id ? 'var(--terracotta)' : 'var(--ink-soft)'}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.35 }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(198,93,61,0.1)', fontSize: 13, color: 'var(--terracotta)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={!canPublish}
            style={{
              width: '100%', marginTop: 24,
              background: canPublish ? 'var(--terracotta)' : 'var(--line)',
              color: '#fff', border: 'none',
              padding: 16, borderRadius: 14, fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit',
              cursor: canPublish ? 'pointer' : 'default',
            }}
          >
            {submitting ? 'Création…' : 'Créer le groupe'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════ NEW SORTIE SHEET ═══════════════

const SORTIE_TYPES = [
  { id: 'soirée', label: 'Apéro / soirée', emoji: '🍻', icon: 'cocktail' },
  { id: 'anniv', label: 'Anniversaire', emoji: '🎂', icon: 'cake' },
  { id: 'after', label: 'Afterwork', emoji: '💼', icon: 'beer' },
  { id: 'match', label: 'Match', emoji: '⚽', icon: 'flame' },
]

const NewSortieSheet = ({ onClose, onCreated }) => {
  const { bars: BARS_DATA, addAnnonce, profile } = useData()
  const { user: authUser } = useAuth()
  const [type, setType] = React.useState('soirée')
  const [bar, setBar] = React.useState(BARS_DATA[0]?.id ?? 'ostal')
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('20:00')
  const [maxAttending, setMaxAttending] = React.useState(10)
  const [visibility, setVisibility] = React.useState('private')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const canPublish = authUser && title.trim() && date && !submitting

  const handlePublish = async () => {
    if (!canPublish) return
    setSubmitting(true)
    setError(null)
    const selectedBar = BARS_DATA.find(b => b.id === bar)
    const sortieEmoji = SORTIE_TYPES.find(t => t.id === type)?.emoji ?? '🍻'
    const dateLabel = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    const whenText = `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}. ${time}`

    try {
      const authorName = profile?.name ?? authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'Moi'
      const row = await createAnnonce({
        title: title.trim(),
        bar: selectedBar?.name ?? bar,
        when_text: whenText,
        attending: 1,
        max_attending: maxAttending,
        type,
        author: authorName,
        avatar: authorName[0].toUpperCase(),
        avatar_url: profile?.avatar_url ?? null,
        color: profile?.color ?? '#C65D3D',
        user_id: authUser.id,
        visibility,
      })
      addAnnonce?.({ ...row, emoji: sortieEmoji })
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--paper)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '92%', overflow: 'auto',
        animation: 'slideUp 0.25s',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Nouvelle sortie</div>
          <button onClick={handlePublish} disabled={!canPublish} style={{
            fontSize: 14, fontWeight: 600,
            color: canPublish ? 'var(--terracotta)' : 'var(--ink-mute)',
            background: 'none', border: 'none',
            cursor: canPublish ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>
            {submitting ? '…' : 'Publier'}
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>Ils sortent ce soir</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>Propose une sortie et invite la communauté.</div>

          {!authUser && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(198,93,61,0.08)', textAlign: 'center', fontSize: 14, color: 'var(--ink-soft)' }}>
              Connecte-toi pour proposer une sortie
            </div>
          )}

          {/* Type */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SORTIE_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: type === t.id ? 'var(--ink)' : '#fff',
                  color: type === t.id ? '#fff' : 'var(--ink)',
                  border: type === t.id ? 'none' : '1px solid var(--line)',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={t.icon} size={15} color={type === t.id ? '#fff' : 'var(--ink-soft)'}/>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Titre</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex. Apéro spontané ce soir 🍻"
              style={{ width: '100%', background: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxShadow: 'var(--shadow-card)', boxSizing: 'border-box' }}
            />
          </div>

          {/* Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Bar</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {BARS_DATA.map(b => (
                <button key={b.id} onClick={() => setBar(b.id)} style={{
                  flex: 1, padding: 10, borderRadius: 12,
                  background: bar === b.id ? b.color : '#fff',
                  color: bar === b.id ? '#fff' : 'var(--ink)',
                  border: bar === b.id ? 'none' : '1px solid var(--line)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={{ ostal: 'wine', pignom: 'beer', 'arriere-cour': 'cocktail' }[b.id]} size={18} color={bar === b.id ? '#fff' : b.color}/>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date & time */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Date</div>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', background: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxShadow: 'var(--shadow-card)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Heure</div>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%', background: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxShadow: 'var(--shadow-card)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Max attendees */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
              Nombre de places ({maxAttending})
            </div>
            <input
              type="range"
              min={2} max={30} step={1}
              value={maxAttending}
              onChange={e => setMaxAttending(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--terracotta)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>
              <span>2</span><span>30</span>
            </div>
          </div>

          {/* Visibility */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Visibilité</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'private', label: 'Groupe privé', icon: 'lock', sub: 'Seulement les membres invités' },
                { id: 'friends', label: 'Ouvert aux amis', icon: 'users', sub: 'Visible par tes amis, qui peuvent rejoindre' },
                { id: 'public', label: 'Ouvert à tous', icon: 'globe', sub: 'Visible par tous les utilisateurs' },
              ].map(p => (
                <button key={p.id} onClick={() => setVisibility(p.id)} style={{
                  padding: 12, borderRadius: 12, textAlign: 'left',
                  background: visibility === p.id ? 'rgba(198,93,61,0.08)' : '#fff',
                  border: visibility === p.id ? '2px solid var(--terracotta)' : '1px solid var(--line)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <Icon name={p.icon} size={18} color={visibility === p.id ? 'var(--terracotta)' : 'var(--ink-soft)'}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.35 }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(198,93,61,0.1)', fontSize: 13, color: 'var(--terracotta)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={!canPublish}
            style={{
              width: '100%', marginTop: 24,
              background: canPublish ? 'var(--terracotta)' : 'var(--line)',
              color: '#fff', border: 'none',
              padding: 16, borderRadius: 14, fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit',
              cursor: canPublish ? 'pointer' : 'default',
            }}
          >
            {submitting ? 'Publication…' : 'Proposer la sortie'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { GroupesScreen, GroupChatScreen, DMChatScreen, NewAnnonceSheet, NewSortieSheet }
