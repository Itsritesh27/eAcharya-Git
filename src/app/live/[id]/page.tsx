import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeaveLink } from "@/components/live/leave-link";
import { LiveRoom } from "@/components/live/live-room-lazy";
import { requireSession } from "@/lib/auth/session";
import { getSession } from "@/lib/live-sessions/data";
import { idSchema } from "@/lib/live-sessions/validation";

export const metadata: Metadata = { title: "Live class" };
export const dynamic = "force-dynamic";

export default async function LiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const session = await requireSession(`/live/${id}`);
  // Row-level security only returns classes this user may see.
  const live = await getSession(id);
  if (!live) notFound();

  const backHref = session.profile.role === "teacher" ? "/dashboard/teacher/live" : "/dashboard/student/live";

  return (
    <div className="flex h-dvh flex-col bg-forest-950 pb-[env(safe-area-inset-bottom)] text-white">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-1">
        <LeaveLink href={backHref} />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold">{live.title}</h1>
          <p className="truncate text-xs text-white/60">{live.courseTitle}</p>
        </div>
      </header>
      <main id="main" className="min-h-0 flex-1">
        <LiveRoom sessionId={id} backHref={backHref} />
      </main>
    </div>
  );
}
