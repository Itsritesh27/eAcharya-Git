-- eAcharya multilingual learning: private preferences + reusable translated learning assets.
-- Apply after 20261106000002_forum_doubts_video_fixes.sql (or the latest migration).

create table if not exists public.student_language_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  content_language text not null default 'hi' check (content_language in ('as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur')),
  subtitle_language text not null default 'hi' check (subtitle_language in ('as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur')),
  audio_language text not null default 'hi' check (audio_language in ('as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger student_language_preferences_set_updated_at
  before update on public.student_language_preferences
  for each row execute function public.set_updated_at();

alter table public.student_language_preferences enable row level security;
revoke all on public.student_language_preferences from anon, authenticated;
grant select, insert (user_id, content_language, subtitle_language, audio_language),
  update (content_language, subtitle_language, audio_language, updated_at)
  on public.student_language_preferences to authenticated;
create policy "language preferences: read own"
  on public.student_language_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "language preferences: insert own"
  on public.student_language_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "language preferences: update own"
  on public.student_language_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.learning_language_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  content_type text not null check (content_type in ('lesson_transcript','resource_notes','pdf_text','subtitles','dubbed_audio','spoken_notes')),
  target_language text not null check (target_language in ('as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur')),
  source_hash text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  source_text text not null check (char_length(source_text) <= 100000),
  translated_text text check (translated_text is null or char_length(translated_text) <= 100000),
  asset_url text check (asset_url is null or (char_length(asset_url) <= 2000 and asset_url ~* '^https://')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_language_assets_one_parent check ((lesson_id is not null and resource_id is null) or (lesson_id is null and resource_id is not null)),
  constraint learning_language_assets_payload check (translated_text is not null or asset_url is not null)
);

create unique index if not exists learning_language_assets_cache_idx
  on public.learning_language_assets (
    coalesce(lesson_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(resource_id, '00000000-0000-0000-0000-000000000000'::uuid),
    content_type, target_language, source_hash
  ) where status <> 'rejected';
create index if not exists learning_language_assets_lesson_idx
  on public.learning_language_assets(lesson_id, target_language, content_type, status);
create index if not exists learning_language_assets_resource_idx
  on public.learning_language_assets(resource_id, target_language, content_type, status);
create trigger learning_language_assets_set_updated_at
  before update on public.learning_language_assets
  for each row execute function public.set_updated_at();

alter table public.learning_language_assets enable row level security;
revoke all on public.learning_language_assets from anon, authenticated;
grant select on public.learning_language_assets to authenticated;
grant insert (lesson_id, resource_id, content_type, target_language, source_hash, source_text, translated_text, asset_url, created_by)
  on public.learning_language_assets to authenticated;
grant update (status, reviewed_by, reviewed_at, translated_text, asset_url, updated_at)
  on public.learning_language_assets to authenticated;

-- Read only if the user can already read the source lesson/resource. Approved items are shared
-- with the same authorised audience. Pending/rejected items are private to their author and staff.
create policy "language assets: read authorised source"
  on public.learning_language_assets for select to authenticated
  using (
    (
      (
        lesson_id is not null
        and (public.is_enrolled_in_lesson(lesson_id) or public.owns_lesson_course(lesson_id) or public.is_admin())
      )
      or (
        resource_id is not null
        and exists (
          select 1 from public.resources r
          where r.id = learning_language_assets.resource_id
            and (
              (r.is_published and (r.course_id is null or exists (
                select 1 from public.courses c where c.id = r.course_id and c.status = 'published'
              )))
              or r.created_by = (select auth.uid())
              or public.is_admin()
            )
        )
      )
    )
    and (status = 'approved' or created_by = (select auth.uid()) or public.is_admin()
      or (lesson_id is not null and public.owns_lesson_course(lesson_id))
      or (resource_id is not null and public.is_teacher_or_admin() and exists (
        select 1 from public.resources r where r.id = learning_language_assets.resource_id and r.created_by = (select auth.uid())
      )))
  );

create policy "language assets: students cache accessible lesson translations"
  on public.learning_language_assets for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and (
      (lesson_id is not null and (public.is_enrolled_in_lesson(lesson_id) or public.owns_lesson_course(lesson_id) or public.is_admin()))
      or
      (resource_id is not null and exists (
        select 1 from public.resources r
        where r.id = learning_language_assets.resource_id
          and (
            (r.is_published and (r.course_id is null or exists (
              select 1 from public.courses c where c.id = r.course_id and c.status = 'published'
            )))
            or r.created_by = (select auth.uid())
            or public.is_admin()
          )
      ))
    )
  );

create policy "language assets: owning teachers review lesson translations"
  on public.learning_language_assets for update to authenticated
  using (
    public.is_admin()
    or (lesson_id is not null and public.is_teacher_or_admin() and public.owns_lesson_course(lesson_id))
    or (resource_id is not null and public.is_teacher_or_admin() and exists (
      select 1 from public.resources r where r.id = learning_language_assets.resource_id and r.created_by = (select auth.uid())
    ))
  )
  with check (
    public.is_admin()
    or (lesson_id is not null and public.is_teacher_or_admin() and public.owns_lesson_course(lesson_id))
    or (resource_id is not null and public.is_teacher_or_admin() and exists (
      select 1 from public.resources r where r.id = learning_language_assets.resource_id and r.created_by = (select auth.uid())
    ))
  );
