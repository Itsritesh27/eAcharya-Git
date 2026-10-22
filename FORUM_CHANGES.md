# Forum update

- The forum is now class-first: Class 9, 10, 11 and 12 filters remain, while topic-category selection/filtering has been removed from the UI.
- Existing database category values are migrated to `general` by `supabase/migrations/20261104000001_class_forum_attachments.sql`.
- The same migration creates a Supabase Storage bucket for images and PDFs with a 10 MB per-file limit and authenticated upload/read policies.
- Discussion and reply forms now upload images/PDFs and insert the resulting HTTPS URLs into their links/text fields, so the links can be saved with the post/reply.

## Important

Run the new migration in the Supabase SQL editor or through your normal migration workflow before deploying. The video-player timestamp-linked doubt workflow is not yet wired in this patch. Also, uploaded files are stored as URLs in the post/reply content rather than as separate attachment records.
