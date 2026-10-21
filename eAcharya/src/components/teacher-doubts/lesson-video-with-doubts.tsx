"use client";

import { useState } from "react";
import { VideoPlayer } from "@/components/learning/video-player";
import { StudentDoubtPanel } from "@/components/teacher-doubts/student-doubt-panel";
import type { StudentLessonDoubt } from "@/lib/teacher-doubts/data";
import type { VideoSource } from "@/lib/learning/video";
import { TriangleAlert, VideoOff } from "lucide-react";

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
}) {
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(startAt);

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
      {canAsk && (
        <StudentDoubtPanel
          courseId={courseId}
          lessonId={lessonId}
          currentTimeSeconds={currentTimeSeconds}
          canUsePlaybackTime={source !== null && source.kind !== "youtube"}
          initialDoubts={initialDoubts}
        />
      )}
    </div>
  );
}
