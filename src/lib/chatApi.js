import { supabase } from './supabase'

// ─── FRIENDS ────────────────────────────────────────────────────────────────

export async function getFriends(userId) {
  const [{ data, error }, { data: unreadRows, error: unreadError }] = await Promise.all([
    supabase
      .from('friendships')
      .select(`
        id, status, created_at,
        requester_p:profiles!friendships_requester_fkey(id, name, handle, avatar_letter, avatar_url, color),
        addressee_p:profiles!friendships_addressee_fkey(id, name, handle, avatar_letter, avatar_url, color)
      `)
      .eq('status', 'accepted')
      .or(`requester.eq.${userId},addressee.eq.${userId}`),
    supabase.rpc('get_direct_unread_counts', { p_user_id: userId }),
  ])
  if (error) throw error
  if (unreadError) throw unreadError
  const unreadByFriend = new Map((unreadRows ?? []).map(row => [row.friend_id, row]))
  return (data ?? []).map(f => {
    const friend = f.requester_p.id === userId ? f.addressee_p : f.requester_p
    const unread = unreadByFriend.get(friend.id)
    return {
      friendshipId: f.id,
      ...friend,
      lastMsg: unread?.last_message_text ?? '',
      time: unread?.last_message_at ? fmtTime(unread.last_message_at) : '',
      unread: Number(unread?.unread_count ?? 0),
    }
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

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_letter, avatar_url, color, bio')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function getFriendProfileSummary(myId, friendId) {
  const [
    profile,
    { data: friendship, error: friendshipError },
    { data: sharedGroups, error: groupsError },
    { data: createdSorties, error: createdSortiesError },
    { count: joinedSortiesCount, error: joinedSortiesError },
    { data: privacyRow },
  ] = await Promise.all([
    getProfile(friendId),
    supabase
      .from('friendships')
      .select('created_at')
      .eq('status', 'accepted')
      .or(`and(requester.eq.${myId},addressee.eq.${friendId}),and(requester.eq.${friendId},addressee.eq.${myId})`)
      .maybeSingle(),
    supabase
      .from('group_members')
      .select('group_id, joined_at, group:group_chats(id, name, emoji, type)')
      .eq('user_id', friendId)
      .order('joined_at', { ascending: false }),
    supabase
      .from('annonces')
      .select('id, title, bar, when_text, scheduled_at, attending, max_attending', { count: 'exact' })
      .eq('user_id', friendId)
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .limit(3),
    supabase
      .from('annonce_participants')
      .select('annonce_id', { count: 'exact', head: true })
      .eq('user_id', friendId),
    supabase
      .from('privacy_preferences')
      .select('show_stats, share_joined_sorties')
      .eq('user_id', friendId)
      .maybeSingle(),
  ])

  if (friendshipError) throw friendshipError
  if (groupsError) throw groupsError
  if (createdSortiesError) throw createdSortiesError
  if (joinedSortiesError) throw joinedSortiesError

  const showStats = privacyRow?.show_stats !== false
  const shareJoinedSorties = privacyRow?.share_joined_sorties !== false

  return {
    ...profile,
    friendship_created_at: friendship?.created_at ?? null,
    shared_groups: (sharedGroups ?? [])
      .map(row => ({
        id: row.group?.id ?? row.group_id,
        name: row.group?.name ?? 'Groupe',
        emoji: row.group?.emoji ?? '💬',
        type: row.group?.type ?? 'permanent',
        joined_at: row.joined_at,
      }))
      .filter(group => group.id),
    created_sorties_count: showStats ? (createdSorties?.length ?? 0) : null,
    joined_sorties_count: (showStats && shareJoinedSorties) ? (joinedSortiesCount ?? 0) : null,
    latest_sorties: (createdSorties ?? []).map(sortie => ({
      ...sortie,
      when: sortie.when_text,
      maxAttending: sortie.max_attending,
    })),
  }
}

export function subscribeToProfile(userId, callback) {
  return supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`,
    }, payload => callback(payload.new))
    .subscribe()
}

export async function searchUsers(query) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_letter, avatar_url, color, priv:privacy_preferences(discoverable)')
    .or(`name.ilike.%${query}%,handle.ilike.%${query}%`)
    .limit(10)
  if (error) throw error
  return data
    .filter(u => {
      const p = Array.isArray(u.priv) ? u.priv[0] : u.priv
      return !p || p.discoverable !== false
    })
    .map(({ priv: _priv, ...rest }) => rest)
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
  const [{ data: memberRows }, { data, error }, { data: unreadRows, error: unreadError }] = await Promise.all([
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
    supabase.rpc('get_group_unread_counts', { p_user_id: userId }),
  ])
  if (error) throw error
  if (unreadError) throw unreadError
  const memberGroupIds = new Set((memberRows ?? []).map(r => r.group_id))
  const unreadByGroup = new Map((unreadRows ?? []).map(row => [row.group_id, row]))
  return (data ?? []).map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    type: g.type,
    visibility: g.visibility ?? 'private',
    expires_at: g.expires_at,
    members: g.members[0]?.count ?? 0,
    lastMsg: unreadByGroup.get(g.id)?.last_message_text ?? g.last_message[0]?.text ?? '',
    time: unreadByGroup.get(g.id)?.last_message_at
      ? fmtTime(unreadByGroup.get(g.id).last_message_at)
      : (g.last_message[0] ? fmtTime(g.last_message[0].created_at) : ''),
    unread: Number(unreadByGroup.get(g.id)?.unread_count ?? 0),
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

export async function markGroupMessagesRead(groupId) {
  const { data, error } = await supabase.rpc('mark_group_messages_read', { p_group_id: groupId })
  if (error) throw error
  return data
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

export async function markDirectMessagesRead(friendId) {
  const { data, error } = await supabase.rpc('mark_direct_messages_read', { p_friend_id: friendId })
  if (error) throw error
  return data
}

export async function markAllSocialMessagesRead() {
  const { data, error } = await supabase.rpc('mark_all_social_messages_read')
  if (error) throw error
  return data
}

export async function getSocialUnreadSummary(userId) {
  const [{ data: groupRows, error: groupError }, { data: dmRows, error: dmError }] = await Promise.all([
    supabase.rpc('get_group_unread_counts', { p_user_id: userId }),
    supabase.rpc('get_direct_unread_counts', { p_user_id: userId }),
  ])
  if (groupError) throw groupError
  if (dmError) throw dmError

  const groups = (groupRows ?? []).reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0)
  const friends = (dmRows ?? []).reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0)
  return { groups, friends, total: groups + friends }
}

export function subscribeToSocialUnreadChanges(userId, callback) {
  return supabase
    .channel(`social-unread:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'group_messages',
    }, callback)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
    }, payload => {
      const msg = payload.new
      if (msg.sender_id === userId || msg.recipient_id === userId) callback(payload)
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'group_message_reads',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'direct_message_reads',
      filter: `user_id=eq.${userId}`,
    }, callback)
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
