# Apply the eAcharya forum/private-doubt repair

1. Open the **Supabase project connected to your local app**.
2. Open **SQL Editor → New query**.
3. Open and copy the complete contents of `supabase/migrations/20261106000001_forum_doubts_video_fixes.sql` from this project into the editor.
4. Click **Run** and confirm the query completes without an error. The migration starts by dropping the old `discussions_category_check`, normalising old values to `general`, and then applying the new check; it also creates the `forum-attachments` bucket and private-doubt table/policies.
5. Stop the Next.js server with `Ctrl+C`, then run `npm install` and `npm run dev` from the project folder.
6. Test with two separate accounts: a student (create a class discussion, attach an image/PDF, send a private doubt) and the teacher assigned to that published course (reply to the doubt).

## Important for videos

The Class 9–12 content migration provides study-guide and worksheet lessons, but no actual lecture video links. With the fixed counter these lessons should not be counted as videos. Open **Teacher → Videos → a chapter**, add real YouTube URLs or HTTPS `.mp4` / `.webm` / `.ogv` files, and use **Open / test video link** for any existing entries that still fail. No app can repair a deleted/private YouTube video without a working replacement URL.
