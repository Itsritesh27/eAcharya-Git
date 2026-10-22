"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircleQuestion, X } from "lucide-react";
import { StudentDoubtPanel } from "@/components/teacher-doubts/student-doubt-panel";
import type { StudentLessonDoubt } from "@/lib/teacher-doubts/data";

type Ctx = {
  canAsk: boolean;
  /** Called by the video on every time update. Stored in a ref so playback never re-renders the page. */
  reportTime: (seconds: number) => void;
  openDoubt: () => void;
  count: number;
};

const AskDoubtContext = createContext<Ctx>({ canAsk: false, reportTime: () => {}, openDoubt: () => {}, count: 0 });

export const useAskDoubt = () => useContext(AskDoubtContext);

/**
 * Owns the "Ask doubt" dialog for a lesson. The video reports its playback time in, and the
 * button (rendered in the tab bar) opens the dialog. The form stays mounted once opened so a
 * half-written question is not lost when the dialog is closed.
 */
export function AskDoubtProvider({
  courseId,
  lessonId,
  canAsk,
  canUsePlaybackTime,
  initialDoubts,
  startAt,
  children,
}: {
  courseId: string;
  lessonId: string;
  canAsk: boolean;
  canUsePlaybackTime: boolean;
  initialDoubts: StudentLessonDoubt[];
  startAt: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeSnapshot, setTimeSnapshot] = useState(startAt);
  const timeRef = useRef(startAt);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const reportTime = useCallback((s: number) => { timeRef.current = s; }, []);
  const openDoubt = useCallback(() => {
    setTimeSnapshot(timeRef.current);
    setEverOpened(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = useMemo(
    () => ({ canAsk, reportTime, openDoubt, count: initialDoubts.length }),
    [canAsk, reportTime, openDoubt, initialDoubts.length],
  );

  return (
    <AskDoubtContext.Provider value={value}>
      {children}
      {canAsk && mounted && everOpened && createPortal(
        <div hidden={!open} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="ask-doubt-heading">
          <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-forest-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-lift sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[36rem] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-sage-200 px-5 py-3">
              <h2 id="ask-doubt-heading" className="text-base font-bold text-forest-950">Ask doubt</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-forest-700 hover:bg-sage-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
              <StudentDoubtPanel
                embedded
                courseId={courseId}
                lessonId={lessonId}
                currentTimeSeconds={timeSnapshot}
                canUsePlaybackTime={canUsePlaybackTime}
                initialDoubts={initialDoubts}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </AskDoubtContext.Provider>
  );
}

/** Button for the lesson tab bar. Renders nothing when the viewer cannot ask doubts. */
export function AskDoubtButton() {
  const { canAsk, openDoubt, count } = useAskDoubt();
  if (!canAsk) return null;
  return (
    <button
      type="button"
      onClick={openDoubt}
      aria-haspopup="dialog"
      className="mb-1 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 active:scale-[0.98]"
    >
      <MessageCircleQuestion className="h-4 w-4" aria-hidden />
      Ask doubt
      {count > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs tabular-nums" aria-label={`${count} asked`}>{count}</span>}
    </button>
  );
}
