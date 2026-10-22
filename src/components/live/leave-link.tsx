"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Leaving mid-class is easy to do by accident on a phone, so ask first. */
export function LeaveLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!window.confirm("Leave this live class?")) e.preventDefault();
      }}
      className="inline-flex min-h-11 items-center gap-1.5 pr-2 text-sm text-white/80 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Leave
    </Link>
  );
}
