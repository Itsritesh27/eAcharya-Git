import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <PageShell>
      <div className="container-page space-y-5 py-10" role="status" aria-label="Loading">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </PageShell>
  );
}
