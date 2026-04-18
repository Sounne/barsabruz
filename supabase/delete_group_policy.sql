-- Allow group creators to delete their group (messages + members cascade automatically)
create policy "Creator can delete group"
  on public.group_chats for delete
  using (auth.uid() = created_by);
