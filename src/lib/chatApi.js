import { supabase } from './supabase'

// ─── FRIENDS ────────────────────────────────────────────────────────────────

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, status, created_at,
      requester_p:profiles!friendships_requester_fkey(id, name, handle, avatar_letter, avatar_url, color),
      addressee_p:profiles!friendships_addressee_fkey(id, name, handle, avatar_letter, avatar_url, color)
    `)
    .eq('status', 'accepted')
    .or(`requester.eq.${userId},addressee.eq.${userId}`)
  if (error) throw error
  return data.map(f => {
    const friend = f.requester_p.id === userId ? f.addressee_p : f.requester_p
    return { friendshipId: f.id, ...friend }
  })
}

export async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, created_at,
      requester_p:profiles!friendships_requester_fkey(id, name, handle, avatar_letter, avatar_url, color)
    `)
    .eq('addressee', userId)
    .eq('status', 'pending')
  if (error) throw error
  return data.map(f => ({ requestId: f.id, ...f.requester_p, created_at: f.created_at }))
}

export async function sendFriendRequest(requesterId, addresseeId) {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester: requesterId, addressee: addresseeId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function respondFriendRequest(requestId, status) {
  const { error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', requestId)
  if (error) throw error
}

export async function removeFriend(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}

export function subscribeToFriendships(userId, callback) {
  return supabase
    .channel(`friendships:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friendships',
    }, payload => {
      const row = payload.new ?? payload.old
      if (!row) return
      if (row.requester === userId || row.addressee === userId) {
        callback(payload)
      }
    })
    .subscribe()
}

export async function searchUsers(query) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_letter, avatar_url, color')
    .or(`name.ilike.%${query}%,handle.ilike.%${query}%`)
    .limit(10)
  if (error) throw error
  return data
}

// ─── GROUPS ─────────────────────────────────────────────────────────────────

export async function deleteGroup(groupId) {
  const { error } = await supabase
    .from('group_chats')
    .delete()
    .eq('id', groupId)
  if (error) throw error
}

export async function getAccessibleGroups(userId) {
  const [{ data: memberRows }, { data, error }] = await Promise.all([
    supabase.from('group_members').select('group_id').eq('user_id', userId),
    supabase
      .from('group_chats')
      .select(`
        id, name, emoji, type, visibility, expires_at, created_at, created_by,
        members:group_members(count),
        last_message:group_messages(id, text, created_at)
      `)
      .order('created_at', { referencedTable: 'group_messages', ascending: false })
      .limit(1, { referencedTable: 'group_messages' })
      .order('created_at', { ascending: false }),
  ])
  if (error) throw error
  const memberGroupIds = new Set((memberRows ?? []).map(r => r.group_id))
  return (data ?? []).map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    type: g.type,
    visibility: g.visibility ?? 'private',
    expires_at: g.expires_at,
    members: g.members[0]?.count ?? 0,
    lastMsg: g.last_message[0]?.text ?? '',
    time: g.last_message[0] ? fmtTime(g.last_message[0].created_at) : '',
    unread: 0,
    isMember: memberGroupIds.has(g.id),
    created_by: g.created_by,
  }))
}

export async function joinGroup(groupId, userId) {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })
  if (error) throw error
}

export async function createGroupChat(name, emoji, type, creatorId, memberIds, expiresAt = null, visibility = 'private') {
  // Generate ID client-side so we can insert members before querying the group
  const groupId = crypto.randomUUID()

  const { error: chatErr } = await supabase
    .from('group_chats')
    .insert({ id: groupId, name, emoji, type, expires_at: expiresAt, created_by: creatorId, visibility })
  if (chatErr) throw chatErr

  // Insert members (creator first, then others)
  const allIds = [...new Set([creatorId, ...memberIds])]
  const { error: membErr } = await supabase
    .from('group_members')
    .insert(allIds.map(uid => ({ group_id: groupId, user_id: uid })))
  if (membErr) throw membErr

  // Now SELECT works: user is a member
  const { data: chat, error: selectErr } = await supabase
    .from('group_chats')
    .select('id, name, emoji, type, visibility, expires_at, created_at')
    .eq('id', groupId)
    .single()
  if (selectErr) throw selectErr

  return chat
}

// ─── GROUP MESSAGES ─────────────────────────────────────────────────────────

export async function getGroupMessages(groupId, limit = 50) {
  const { data, error } = await supabase
    .from('group_messages')
    .select(`
      id, text, reactions, shared_event, created_at,
      sender:profiles!group_messages_sender_id_fkey(id, name, avatar_letter, avatar_url, color)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function sendGroupMessage(groupId, senderId, text, sharedEvent = null) {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, sender_id: senderId, text, shared_event: sharedEvent })
    .select(`
      id, text, reactions, shared_event, created_at,
      sender:profiles!group_messages_sender_id_fkey(id, name, avatar_letter, avatar_url, color)
    `)
    .single()
  if (error) throw error
  return data
}

export function subscribeToGroupMessages(groupId, callback) {
  return supabase
    .channel(`group:${groupId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'group_messages',
      filter: `group_id=eq.${groupId}`,
    }, payload => callback(payload.new))
    .subscribe()
}

// ─── DIRECT MESSAGES ────────────────────────────────────────────────────────

export async function getDirectMessages(myId, friendId, limit = 50) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, text, reactions, created_at')
    .or(
      `and(sender_id.eq.${myId},recipient_id.eq.${friendId}),` +
      `and(sender_id.eq.${friendId},recipient_id.eq.${myId})`
    )
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function sendDirectMessage(senderId, recipientId, text) {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, text })
    .select()
    .single()
  if (error) throw error
  return data
}

export function subscribeToDirectMessages(myId, friendId, callback) {
  return supabase
    .channel(`dm:${[myId, friendId].sort().join(':')}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
    }, payload => {
      const msg = payload.new
      if (
        (msg.sender_id === friendId && msg.recipient_id === myId) ||
        (msg.sender_id === myId && msg.recipient_id === friendId)
      ) {
        callback(msg)
      }
    })
    .subscribe()
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel)
}

// ─── UTILS ──────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
