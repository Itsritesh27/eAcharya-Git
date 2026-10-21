-- Class-first discussion forum and attachment storage for posts/replies.
-- Apply this migration in Supabase after the existing forum migrations.
alter table public.discussions drop constraint if exists discussions_category_check;
-- Existing rows must be normalized before the stricter class-first constraint is restored.
update public.discussions set category = 'general' where category is distinct from 'general';
alter table public.discussions add constraint discussions_category_check check (category = 'general');
alter table public.discussions alter column category set default 'general';

-- Public URLs are only returned for uploaded files; write access is restricted to authenticated users
-- and each user can upload only into their own folder. The app should validate file type and size too.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('forum-attachments', 'forum-attachments', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "forum-attachments: authenticated read" on storage.objects;
create policy "forum-attachments: authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'forum-attachments');
drop policy if exists "forum-attachments: upload own folder" on storage.objects;
create policy "forum-attachments: upload own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'forum-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "forum-attachments: delete own folder" on storage.objects;
create policy "forum-attachments: delete own folder"
  on storage.objects for delete to authenticated
  using (bucket_id = 'forum-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
