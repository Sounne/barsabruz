-- Invitations for private sorties ("Ils sortent ce soir")
-- Run AFTER annonce_participants.sql and annonces_visibility.sql

create table if not exists public.annonce_invitations (
  id          uuid primary key default gen_random_uuid(),
  annonce_id  text not null references public.annonces(id) on delete cascade,
  inviter_id  uuid not null references auth.users(id) on delete cascade,
  invitee_id  uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  responded_at timestamptz,
  unique (annonce_id, invitee_id)
);

create index if not exists annonce_invitations_invitee_idx
  on public.annonce_invitations (invitee_id, status);

alter table public.annonce_invitations enable row level security;

drop policy if exists "See own invitations"        on public.annonce_invitations;
drop policy if exists "Create invitations"         on public.annonce_invitations;
drop policy if exists "Respond to own invitation"  on public.annonce_invitations;
drop policy if exists "Delete own invitation"      on public.annonce_invitations;

-- Inviter and invitee can both read; annonce creator can also read invitations for their sortie
create policy "See own invitations"
  on public.annonce_invitations for select
  using (
    auth.uid() = inviter_id
    or auth.uid() = invitee_id
    or exists (
      select 1 from public.annonces a
      where a.id = annonce_invitations.annonce_id and a.user_id = auth.uid()
    )
  );

-- Only the annonce creator may send invitations
create policy "Create invitations"
  on public.annonce_invitations for insert
  with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from public.annonces a
      where a.id = annonce_invitations.annonce_id and a.user_id = auth.uid()
    )
  );

-- Invitee can update status to accept/decline
create policy "Respond to own invitation"
  on public.annonce_invitations for update
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- Inviter can revoke, invitee can remove
create policy "Delete own invitation"
  on public.annonce_invitations for delete
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- ─── Extend private-visibility SELECT policy so invitees can see the annonce ───
drop policy if exists "Read annonces by visibility" on public.annonces;

create policy "Read annonces by visibility"
  on public.annonces for select
  using (
    visibility = 'public'
    or auth.uid() = user_id
    or (
      visibility = 'friends'
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester = auth.uid() and f.addressee = annonces.user_id)
            or (f.addressee = auth.uid() and f.requester = annonces.user_id)
          )
      )
    )
    or exists (
      select 1 from public.annonce_participants ap
      where ap.annonce_id = annonces.id and ap.user_id = auth.uid()
    )
    or exists (
      select 1 from public.annonce_invitations ai
      where ai.annonce_id = annonces.id and ai.invitee_id = auth.uid()
    )
  );

-- ─── Atomic accept: mark invitation accepted + add as participant + recount ───
create or replace function public.accept_annonce_invitation(p_invitation_id uuid)
returns int language plpgsql security definer as $$
declare
  v_annonce_id text;
  v_invitee uuid;
  v_count int;
begin
  update public.annonce_invitations
    set status = 'accepted', responded_at = now()
    where id = p_invitation_id and invitee_id = auth.uid() and status = 'pending'
    returning annonce_id, invitee_id into v_annonce_id, v_invitee;

  if v_annonce_id is null then
    raise exception 'Invitation introuvable ou déjà traitée';
  end if;

  insert into public.annonce_participants (annonce_id, user_id)
    values (v_annonce_id, v_invitee)
    on conflict do nothing;

  select count(*) into v_count from public.annonce_participants where annonce_id = v_annonce_id;
  update public.annonces set attending = v_count where id = v_annonce_id;
  return v_count;
end; $$;

create or replace function public.decline_annonce_invitation(p_invitation_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.annonce_invitations
    set status = 'declined', responded_at = now()
    where id = p_invitation_id and invitee_id = auth.uid() and status = 'pending';
end; $$;
