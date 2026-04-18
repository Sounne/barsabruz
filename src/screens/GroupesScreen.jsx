import React from 'react'
import { Icon, Avatar, Wip } from '../components/ui'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import * as chatApi from '../lib/chatApi'

// ─── Time formatter ──────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Mock messages for unauthenticated / empty groups ────────────────────────

function mockMessages(group) {
  return [
    { id: 1, sender: { id: 'phil', name: 'Phil', avatar_letter: 'P', color: '#6B3A4A' }, text: "Salut les amis ! On se fait quoi ce weekend ?", created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 2, sender: { id: 'clement', name: 'Clément', avatar_letter: 'C', color: '#6D7A3D' }, text: "L'Ostal propose une dégustation vendredi 🍷", created_at: new Date(Date.now() - 5400000).toISOString() },
    { id: 3, sender: { id: 'sarah', name: 'Sarah', avatar_letter: 'S', color: '#D9A44A' }, text: group.lastMsg || "Moi 🙋‍♀️", created_at: new Date(Date.now() - 3600000).toISOString() },
  ]
}

// ═══════════════ GROUP ROW ═══════════════

const GroupRow = ({ group, onClick }) => (
  <div onClick={onClick} style={{
    background: '#fff', borderRadius: 16, padding: 14,
    display: 'flex', gap: 12, alignItems: 'center',
    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
      background: group.type === 'ephemeral'
        ? 'linear-gradient(135deg, #D9A44A, #E89579)'
        : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22,
    }}>{group.emoji}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{group.name}</span>
        {group.type === 'ephemeral' && (
          <span style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--ochre-deep)', background: 'rgba(217,164,74,0.15)',
            padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
          }}>{group.expiresIn || 'Éphémère'}</span>
        )}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {group.lastMsg}
      </div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{group.time}</div>
      {group.unread > 0 && (
        <div style={{
          background: 'var(--terracotta)', color: '#fff',
          fontSize: 11, fontWeight: 600, borderRadius: 999,
          padding: '2px 7px', marginTop: 4, display: 'inline-block',
        }}>{group.unread}</div>
      )}
    </div>
  </div>
)

// ═══════════════ GROUPES SCREEN ═══════════════

const GroupesScreen = ({ onOpenGroup, onOpenDM, onNew }) => {
  const { user } = useData()
  const { user: authUser } = useAuth()
  const [mainTab, setMainTab] = React.useState('groupes')
  const [groupFilter, setGroupFilter] = React.useState('all')

  // Groups
  const [groups, setGroups] = React.useState(null)

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

  // Load groups
  React.useEffect(() => {
    if (!authUser) { setGroups(user.groups); return }
    chatApi.getUserGroups(authUser.id)
      .then(data => setGroups(data.length ? data : user.groups))
      .catch(() => setGroups(user.groups))
  }, [authUser?.id])

  // Load friends + pending
  React.useEffect(() => {
    if (!authUser) return
    setFriendsLoading(true)
    Promise.all([chatApi.getFriends(authUser.id), chatApi.getPendingRequests(authUser.id)])
      .then(([f, p]) => { setFriends(f); setPending(p) })
      .catch(() => {})
      .finally(() => setFriendsLoading(false))
  }, [authUser?.id])

  // Debounced user search
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

  const handleRespond = async (requestId, status) => {
    try {
      await chatApi.respondFriendRequest(requestId, status)
      setPending(prev => prev.filter(r => r.requestId !== requestId))
      if (status === 'accepted' && authUser) {
        chatApi.getFriends(authUser.id).then(setFriends).catch(() => {})
      }
    } catch {}
  }

  const displayGroups = groups ?? user.groups
  const filtered = groupFilter === 'all' ? displayGroups : displayGroups.filter(g => g.type === groupFilter)

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
          {mainTab === 'groupes' && (
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
            {filtered.map(g => <GroupRow key={g.id} group={g} onClick={() => onOpenGroup(g)}/>)}
            <div onClick={onNew} style={{
              marginTop: 14, padding: 18, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(198,93,61,0.08), rgba(217,164,74,0.08))',
              border: '1px dashed rgba(198,93,61,0.3)', textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 26 }}>🎉</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>Organise une soirée</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Crée un groupe éphémère et invite tes amis</div>
            </div>
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
                      <Avatar letter={u.avatar_letter} color={u.color} size={36}/>
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
                  <Avatar letter={req.avatar_letter} color={req.color} size={40}/>
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
                  <Avatar letter={friend.avatar_letter} color={friend.color} size={40}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{friend.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{friend.handle}</div>
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(198,93,61,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="send" size={15} color="var(--terracotta)"/>
                  </div>
                </div>
              ))}
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

const GroupChatScreen = ({ group, onBack }) => {
  const { user } = useData()
  const { user: authUser } = useAuth()
  const [messages, setMessages] = React.useState(null)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const bottomRef = React.useRef(null)

  const isMock = !authUser || /^g\d/.test(String(group.id))

  React.useEffect(() => {
    if (isMock) { setMessages(mockMessages(group)); return }
    chatApi.getGroupMessages(group.id)
      .then(data => setMessages(data.length ? data : mockMessages(group)))
      .catch(() => setMessages(mockMessages(group)))
  }, [group.id])

  React.useEffect(() => {
    if (isMock) return
    const ch = chatApi.subscribeToGroupMessages(group.id, async () => {
      chatApi.getGroupMessages(group.id).then(setMessages).catch(() => {})
    })
    return () => chatApi.unsubscribe(ch)
  }, [group.id])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const send = async () => {
    if (!input.trim()) return
    if (isMock) {
      setMessages(prev => [...(prev ?? []), {
        id: Date.now(),
        sender: { id: 'me', name: user.name, avatar_letter: user.avatar, color: user.color },
        text: input, created_at: new Date().toISOString(),
      }])
      setInput('')
      return
    }
    setSending(true)
    try {
      const msg = await chatApi.sendGroupMessage(group.id, authUser.id, input.trim())
      setMessages(prev => [...(prev ?? []), msg])
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
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: group.type === 'ephemeral' ? 'linear-gradient(135deg, #D9A44A, #E89579)' : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>{group.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{group.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={10}/> Privé · {group.members} membres
          </div>
        </div>
        <Icon name="more" size={22} color="var(--ink-soft)"/>
      </div>

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
        {(messages ?? []).map(m => {
          const isMe = m.sender?.id === authUser?.id
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isMe && <Avatar letter={m.sender?.avatar_letter} color={m.sender?.color} size={28}/>}
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
        <Avatar letter={friend.avatar_letter} color={friend.color} size={40}/>
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
              {!isMe && <Avatar letter={friend.avatar_letter} color={friend.color} size={28}/>}
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

const NewAnnonceSheet = ({ onClose }) => {
  const { bars: BARS_DATA } = useData()
  const [type, setType] = React.useState('soirée')
  const [privacy, setPrivacy] = React.useState('public')
  const [bar, setBar] = React.useState('ostal')

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
          <div style={{ fontSize: 13, fontWeight: 600 }}>Nouvelle annonce</div>
          <div style={{ fontSize: 14, color: 'var(--terracotta)', fontWeight: 600 }}>Publier</div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>Organise une sortie</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>En 3 étapes : le quoi, le où, le qui.</div>

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

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Titre</div>
            <input placeholder="Ex. Anniv de Théo 🎂" defaultValue="Qui est chaud ce soir ?"
              style={{ width: '100%', background: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxShadow: 'var(--shadow-card)' }}/>
          </div>

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

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Visibilité</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'public', label: 'Ouvert à tous', icon: 'globe', sub: 'Visible sur le feed public' },
                { id: 'group', label: 'Groupe privé', icon: 'lock', sub: 'Seulement les membres invités' },
              ].map(p => (
                <button key={p.id} onClick={() => setPrivacy(p.id)} style={{
                  flex: 1, padding: 12, borderRadius: 12, textAlign: 'left',
                  background: privacy === p.id ? 'rgba(198,93,61,0.08)' : '#fff',
                  border: privacy === p.id ? '2px solid var(--terracotta)' : '1px solid var(--line)',
                  fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  <Icon name={p.icon} size={18} color={privacy === p.id ? 'var(--terracotta)' : 'var(--ink-soft)'}/>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: 'var(--ink)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.35 }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <Wip>
            <button style={{
              width: '100%', marginTop: 24,
              background: 'var(--terracotta)', color: '#fff', border: 'none',
              padding: 16, borderRadius: 14, fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>Publier l'annonce</button>
          </Wip>
        </div>
      </div>
    </div>
  )
}

export { GroupesScreen, GroupChatScreen, DMChatScreen, NewAnnonceSheet }
