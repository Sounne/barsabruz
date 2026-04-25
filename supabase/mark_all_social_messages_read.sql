-- Mark every group and direct message thread as read for the authenticated user.

create or replace function public.mark_all_social_messages_read()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_rows integer := 0;
  v_direct_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  with readable_groups as (
    select
      gm.group_id,
      coalesce(max(msg.created_at), now()) as last_read_at
    from public.group_members gm
    left join public.group_messages msg
      on msg.group_id = gm.group_id
    where gm.user_id = v_user_id
    group by gm.group_id
  )
  insert into public.group_message_reads (group_id, user_id, last_read_at)
  select group_id, v_user_id, last_read_at
  from readable_groups
  on conflict (group_id, user_id)
  do update set last_read_at = greatest(public.group_message_reads.last_read_at, excluded.last_read_at);

  get diagnostics v_group_rows = row_count;

  with accepted_friends as (
    select case
      when requester = v_user_id then addressee
      else requester
    end as friend_id
    from public.friendships
    where status = 'accepted'
      and (requester = v_user_id or addressee = v_user_id)
  ),
  readable_direct as (
    select
      af.friend_id,
      coalesce(max(dm.created_at), now()) as last_read_at
    from accepted_friends af
    left join public.direct_messages dm
      on (dm.sender_id = v_user_id and dm.recipient_id = af.friend_id)
      or (dm.sender_id = af.friend_id and dm.recipient_id = v_user_id)
    group by af.friend_id
  )
  insert into public.direct_message_reads (user_id, friend_id, last_read_at)
  select v_user_id, friend_id, last_read_at
  from readable_direct
  on conflict (user_id, friend_id)
  do update set last_read_at = greatest(public.direct_message_reads.last_read_at, excluded.last_read_at);

  get diagnostics v_direct_rows = row_count;

  return jsonb_build_object('groups', v_group_rows, 'friends', v_direct_rows);
end;
$$;

grant execute on function public.mark_all_social_messages_read() to authenticated;
