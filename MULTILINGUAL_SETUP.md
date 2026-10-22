# eAcharya Multilingual Learning — Setup and Capability Notes

This implementation adds language preferences, a provider-neutral translation workflow, cached language assets, voice entry for private student doubts, transcript playback, timed WebVTT/SRT translation, optional TTS audio-track generation, and a teacher review queue. It does **not** require BHASHINI or expose provider secrets to the browser.

## 1. Apply the Supabase migration

Apply `supabase/migrations/20261107000001_multilingual_learning.sql` after the existing forum/video-doubt migrations. It creates:

- `student_language_preferences`: the signed-in user's content, subtitle, and audio language choices.
- `learning_language_assets`: reusable translations, timed subtitle tracks, and generated audio-track URLs, with pending/approved/rejected review states.

The migration includes row-level security and column-level grants. Preferences are private to each user. Learning assets are only readable for a lesson/resource the user is allowed to read; pending assets are private to the creator and owning teacher/admin. Approval makes an asset reusable by the same authorised audience. This feature does not change or query the private `teacher_doubts` records.

## 2. Configure translation

Set these **server-side** environment variables in `.env.local` for local development and in Netlify's environment variables for deployment:

```dotenv
LIBRETRANSLATE_URL=https://your-trusted-translation-host.example
LIBRETRANSLATE_API_KEY=
```

The app appends `/translate` unless the URL already ends in that path. It sends a LibreTranslate-compatible JSON request with `q`, `source: "auto"`, `target`, and `format: "text"`; the response must contain `translatedText`. An API key is optional and is sent only from the server. Prefer a self-hosted endpoint for a free/open-source deployment. A translation adapter around IndicTrans2 or another open model can be used if it implements this compatibility contract.

There is deliberately no default public translation endpoint. If `LIBRETRANSLATE_URL` is absent, eAcharya displays a configuration message and does not silently call a paid service. The UI lists all 22 Scheduled Languages, but listing a language does **not** imply the configured model supports it; unsupported language pairs return an explicit error. Model availability, script quality, transliteration, and subject-specific accuracy depend on the configured service.

## 3. Configure AI-generated audio tracks (optional)

For saved audio files, configure a self-hosted speech service:

```dotenv
EACHARYA_SPEECH_SERVICE_URL=https://your-trusted-speech-host.example
EACHARYA_SPEECH_SERVICE_TOKEN=
```

The app appends `/synthesize` unless the configured URL already ends with that path. It sends a POST request with this JSON body:

```json
{
  "text": "Translated lesson text goes here",
  "language": "hi",
  "task": "lesson_audio_track",
  "output": "audio_url"
}
```

The service must return JSON such as:

```json
{
  "audio_url": "https://your-trusted-storage.example/generated/track.mp3"
}
```

`EACHARYA_SPEECH_SERVICE_TOKEN`, when set, is sent as a Bearer token only from the server. The output URL must use HTTPS and remain valid for reuse; configure your service/storage so the audio asset is available to authorised learners for the intended retention period. The service can wrap Piper, another open TTS model, or any compatible speech engine. Confirm each model's language and voice coverage before promising support.

When the speech service is not configured, students can still use browser text-to-speech if their device has a voice installed for the selected language. Browser playback supports play/pause/resume/stop and speed adjustment, but does not create a downloadable audio file. A generated transcript audio track is a separate audio asset: the current integration does not re-encode the original video or automatically time-align speech pauses to the video soundtrack.

## 4. How students and teachers use it

- Students can choose separate content, subtitle, and audio language preferences at **Dashboard → Settings**.
- On a lesson page, **Learn in your language** translates the teacher's transcript. If the stored transcript is valid WebVTT or SRT and has up to 60 cues, timestamps/cue boundaries are preserved in a translated WebVTT track for HTML video files/HLS supported by the browser. YouTube embeds cannot accept a custom local text track, so the translated text remains available below the embedded player.
- A plain-text transcript is translated as text and is not synchronised to individual video frames. The teacher needs to supply properly timed WebVTT/SRT cues for synchronised captions.
- Text-based notes resources are translated directly. For a PDF, the current path translates text copied from the PDF into the text box; the original PDF is never overwritten. Scanned PDFs need OCR before they can be translated. The translated view may simplify layout and will not reproduce complex tables/figures exactly.
- Students can use **Ask by voice** within private doubt entry. The browser's speech-recognition API converts speech to editable text; the student reviews and submits that text through the existing private doubt action. Recognition support and languages vary by browser/device and microphone permission.
- Teachers open **Dashboard → Language Review** to approve or reject generated reusable translations/audio associated with their own content. Unapproved translations are labelled in the student UI.

## 5. Validation checklist

1. Confirm the new migration applied successfully in Supabase.
2. Save a language preference and refresh the page; the values should persist from the database.
3. With `LIBRETRANSLATE_URL` unset, confirm translation displays the setup message and normal lessons still load.
4. Configure a compatible endpoint and try a supported language; verify cache reuse on a repeat request.
5. Enter valid VTT/SRT cues as the lesson transcript and verify a direct video offers translated native captions after translation. YouTube captions fall back to transcript display.
6. Test voice input with microphone permission denied and with a browser without speech recognition; the typed doubt form must remain usable.
7. Confirm pending assets are visible only to the creator/owning teacher/admin, and approved items are reusable by users who can read the original lesson/resource.
8. Test on mobile, tablet, and desktop; audio controls wrap on small screens.

## Important limitations

- The language selector targets all 22 Scheduled Languages, but free/open-source providers do not necessarily have translation and speech models for all 22. Provider/model capability is checked at request time and unavailable pairs are labelled.
- PDF translation currently requires selectable/copyable PDF text; OCR and in-place PDF layout reconstruction are not included.
- Generated audio requires an external, self-hosted-compatible speech service. The included browser fallback is playback-only, not a generated file.
- Caption synchronisation is possible only when timing cues are present. Plain transcripts and YouTube embeds remain text-based fallbacks.


## Adding video transcripts and captions

See [`TRANSCRIPT_AND_CAPTIONS_GUIDE.md`](./TRANSCRIPT_AND_CAPTIONS_GUIDE.md) for the teacher workflow. Teachers can paste plain text or import `.txt`, `.vtt`, and `.srt` files while adding a video, or open an existing video and choose **Add transcript / captions** / **Edit transcript / captions**. Timed WebVTT/SRT cues are required for synchronised captions; plain text supports the transcript tab, translation, and speech playback.
