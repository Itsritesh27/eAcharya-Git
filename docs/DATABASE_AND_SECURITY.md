# Database, migrations and security

## Critical migration note

The supplied source archive contained conflicting migration versions. This cleanup removed the byte-for-byte duplicate `20261106000001_forum_doubts_video_fixes.sql` because its exact contents are retained in `20261106000002_forum_doubts_video_fixes.sql`; it also moved the idempotent `teacher_add_chapters` policy script to `20261107000005_teacher_add_chapters.sql` so each local migration version is unique. The old name `20261107000001_teacher_add_chapters.sql` should no longer be used in setup instructions.

**This is a local-file cleanup only, not a reconciliation of your production Supabase migration history.** The database owner must compare the remote migration ledger and current schema before using `supabase db push`. The Supabase project was not accessible to this edit, and it is unknown which SQL files were previously run manually in SQL Editor. Do not run `supabase db reset`, destructive SQL, or a production `db push` based only on this archive.

If using Supabase CLI, first link the intended project and inspect migration state using the supported CLI commands for the installed CLI version. Compare the remote migration versions with every file in `supabase/migrations/`, then test reconciliation against a disposable/staging database before production. If migrations were applied manually through SQL Editor, document that and reconcile the migration ledger rather than blindly reapplying them.

## Security essentials

- Only the publishable Supabase key belongs in browser code. Service-role/secret keys are server-only and must not be included in an archive.
- Keep Row Level Security enabled and test ownership/role policies for student, teacher and admin accounts.
- Private doubts and student records must be readable only by the student author and authorized teacher/admin workflows.
- Keep resources private when they are private; use scoped access or signed URLs.
- Do not trust `user_metadata`, query parameters, frontend role state or hidden UI to authorize privileged actions.
- Never commit `.env.local`. Rotate any credential that has been exposed.

## No production data is included

The project archive contains application code and SQL files only; it is not a database backup and does not prove which migrations are already applied to your live Supabase project. Export/backup important data before approved schema changes.
