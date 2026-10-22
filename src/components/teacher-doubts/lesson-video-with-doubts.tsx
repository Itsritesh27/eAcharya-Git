"use client";

import { useState, type ReactNode } from "react";
import { VideoPlayer } from "@/components/learning/video-player";
import { StudentDoubtPanel } from "@/components/teacher-doubts/student-doubt-panel";
import type { StudentLessonDoubt } from "@/lib/teacher-doubts/data";
import type { VideoSource } from "@/lib/learning/video";
import { FileText, FolderOpen, MessageCircleQuestion, NotebookPen, TriangleAlert, VideoOff } from "lucide-react";
import { MultilingualLearningTools } from "@/components/multilingual/multilingual-learning-tools";
import { languageByCode, type ScheduledLanguageCode } from "@/lib/multilingual/languages";

export function LessonVideoWithDoubts({
  source,
  videoConfigured,
  title,
  lessonId,
  courseId,
  startAt,
  canTrack,
  allowDownload,
  canAsk,
  initialDoubts,
  transcript,
  preferredLanguage,
  preferredAudioLanguage,
  transcriptPanel,
  notesPanel,
  resourcesPanel,
}: {
  source: VideoSource | null;
  videoConfigured: boolean;
  title: string;
  lessonId: string;
  courseId: string;
  startAt: number;
  canTrack: boolean;
  allowDownload: boolean;
  canAsk: boolean;
  initialDoubts: StudentLessonDoubt[];
  transcript: string;
  preferredLanguage: ScheduledLanguageCode;
  preferredAudioLanguage: ScheduledLanguageCode;
  transcriptPanel: ReactNode;
  notesPanel: ReactNode;
  resourcesPanel: ReactNode;
}) {
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(startAt);
  const [activeSection, setActiveSection] = useState<"transcript" | "notes" | "resources" | "doubt" | null>(null);
  const [subtitleTrackUrl, setSubtitleTrackUrl] = useState<string | null>(null);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>(preferredLanguage === "hi" ? "hi-IN" : preferredLanguage);

  return (
    <div>
      {source ? (
        <VideoPlayer
          source={source}
          title={title}
          lessonId={lessonId}
          startAt={startAt}
          canSave={canTrack}
          allowDownload={allowDownload}
          onCurrentTimeChange={setCurrentTimeSeconds}
          subtitleTrackUrl={subtitleTrackUrl}
          subtitleLanguage={subtitleLanguage}
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-card border border-dashed border-sage-300 bg-sage-50/60 px-6 text-center">
          {videoConfigured ? (
            <>
              <TriangleAlert className="h-8 w-8 text-forest-500" aria-hidden />
              <p className="mt-3 font-semibold">This video can&apos;t be shown</p>
              <p className="mt-1 max-w-sm text-sm text-forest-600">The saved link is not a supported YouTube link or direct video file. Please correct the link in the teacher video dashboard.</p>
            </>
          ) : (
            <>
              <VideoOff className="h-8 w-8 text-forest-500" aria-hidden />
              <p className="mt-3 font-semibold">No video has been added yet</p>
              <p className="mt-1 max-w-sm text-sm text-forest-600">You can still read the lesson details and use the notes and resources below.</p>
            </>
          )}
        </div>
      )}
      <MultilingualLearningTools
        sourceKind="lesson"
        lessonId={lessonId}
        title={title}
        sourceText={transcript}
        hasTranscript={Boolean(transcript.trim())}
        initialLanguage={preferredLanguage}
        initialAudioLanguage={preferredAudioLanguage}
        onSubtitleTrackUrl={(url, language) => {
          setSubtitleTrackUrl(url);
          setSubtitleLanguage(language === "und" ? "und" : languageByCode(language).locale);
        }}
      />
      <section className="mt-6" aria-label="Lesson materials and questions">
        <div className="flex flex-wrap gap-2" aria-label="Open a lesson section">
          <button
            type="button"
            aria-expanded={activeSection === "transcript"}
            aria-controls={`lesson-section-${lessonId}-transcript`}
            onClick={() => setActiveSection((active) => active === "transcript" ? null : "transcript")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${activeSection === "transcript" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700 hover:bg-sage-50"}`}
          >
            <FileText className="h-4 w-4" aria-hidden />Transcript
          </button>
          <button
            type="button"
            aria-expanded={activeSection === "notes"}
            aria-controls={`lesson-section-${lessonId}-notes`}
            onClick={() => setActiveSection((active) => active === "notes" ? null : "notes")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${activeSection === "notes" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700 hover:bg-sage-50"}`}
          >
            <NotebookPen className="h-4 w-4" aria-hidden />Notes
          </button>
          <button
            type="button"
            aria-expanded={activeSection === "resources"}
            aria-controls={`lesson-section-${lessonId}-resources`}
            onClick={() => setActiveSection((active) => active === "resources" ? null : "resources")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${activeSection === "resources" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700 hover:bg-sage-50"}`}
          >
            <FolderOpen className="h-4 w-4" aria-hidden />Resources
          </button>
          {canAsk && (
            <button
              type="button"
              aria-expanded={activeSection === "doubt"}
              aria-controls={`lesson-section-${lessonId}-doubt`}
              onClick={() => setActiveSection((active) => active === "doubt" ? null : "doubt")}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${activeSection === "doubt" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700 hover:bg-sage-50"}`}
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden />Ask Doubt
            </button>
          )}
        </div>

        <div id={`lesson-section-${lessonId}-transcript`} hidden={activeSection !== "transcript"} className="mt-4 rounded-card border border-sage-200 bg-white p-5 shadow-card">
          {transcriptPanel}
        </div>
        <div id={`lesson-section-${lessonId}-notes`} hidden={activeSection !== "notes"} className="mt-4 rounded-card border border-sage-200 bg-white p-5 shadow-card">
          {notesPanel}
        </div>
        <div id={`lesson-section-${lessonId}-resources`} hidden={activeSection !== "resources"} className="mt-4 rounded-card border border-sage-200 bg-white p-5 shadow-card">
          {resourcesPanel}
        </div>
        {canAsk && (
          <div id={`lesson-section-${lessonId}-doubt`} hidden={activeSection !== "doubt"} className="mt-4">
            <StudentDoubtPanel
              courseId={courseId}
              lessonId={lessonId}
              currentTimeSeconds={currentTimeSeconds}
              canUsePlaybackTime={source !== null && source.kind !== "youtube"}
              initialDoubts={initialDoubts}
            />
          </div>
        )}
      </section>
    </div>
  );
}
