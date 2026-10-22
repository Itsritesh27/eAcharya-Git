# eAcharya — Adding Video Transcripts and Captions

Teachers can now add transcript text at upload time or attach it to an existing video.

## When adding a new video

1. Open **Teacher Dashboard → Videos** and choose the relevant chapter.
2. Paste video links or upload a video file from the computer.
3. In the video row, expand **Add transcript / captions (optional)**.
4. Paste the words spoken in the lecture, or use **Import .txt / .vtt / .srt file**.
5. Click **Add video(s) to this chapter**. The transcript is saved with the lesson.

## When the video already exists

1. Find the video in **Videos in this chapter**.
2. Click **Add transcript / captions** (or **Edit transcript / captions** if one already exists).
3. Paste the transcript or import a file, then click **Save transcript**.
4. The student lesson and multilingual tools use the saved transcript after refresh.

## Which format should I use?

- **Plain text or `.txt`:** best for the readable transcript tab, translation, and speech playback.
- **WebVTT `.vtt` or SubRip `.srt` with timestamps:** used for timed caption cues. Existing parsing preserves cue timing and converts SRT timestamps to WebVTT when attaching a supported subtitle track.

Example WebVTT:

```text
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to today's lesson.

00:00:04.500 --> 00:00:07.000
We will begin with the key concepts.
```

## Limits and behavior

- Transcript/caption text is limited to 100,000 characters (import files are limited to 100 KB by the form).
- An empty saved transcript removes the existing transcript.
- Timestamped captions are synchronised on supported direct video playback. YouTube embeds do not expose the same direct file-track integration, so the transcript remains available in the lesson panel; subtitles depend on YouTube's own caption support or translated transcript display.
- Translation and generated audio still depend on the language/speech services configured for this deployment. Browser text-to-speech support varies by device and installed voices.
- The feature uses the existing `lesson_content.transcript` field. No additional database migration is needed for this UI addition, as long as the project's existing lesson-content migration has already been applied.
