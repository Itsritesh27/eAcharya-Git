import type { Metadata } from "next";
import { MessageCircleQuestion } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Welcome } from "@/components/dashboard/welcome";
import { TeacherDoubtInbox } from "@/components/teacher-doubts/teacher-doubt-inbox";
import { requireRole } from "@/lib/auth/session";
import { getTeacherDoubts } from "@/lib/teacher-doubts/data";

export const metadata: Metadata = { title: "Private Student Doubts" };
export const dynamic = "force-dynamic";

export default async function TeacherDoubtsPage() {
  const session = await requireRole("teacher");
  const doubts = await getTeacherDoubts(session.userId);
  const unanswered = doubts.filter((doubt) => !doubt.teacherReply).length;

  return (
    <DashboardShell session={session}>
      <Welcome name={session.profile.full_name} subtitle="Answer private questions sent by students from your lessons." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Private student doubts</h1>
          <p className="mt-1 text-sm text-forest-600">Only you and the student who asked can read each conversation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-sage-200 bg-white px-4 py-3 text-sm">
          <MessageCircleQuestion className="h-4 w-4 text-brand-700" aria-hidden />
          <span><strong>{doubts.length}</strong> total · <strong>{unanswered}</strong> awaiting reply</span>
        </div>
      </div>
      <TeacherDoubtInbox doubts={doubts} />
    </DashboardShell>
  );
}
