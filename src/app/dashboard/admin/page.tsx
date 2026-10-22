import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionHeading, Welcome } from "@/components/dashboard/welcome";
import { Card, CardBody } from "@/components/ui/card";
import { setUserRoleAction } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parsePage, sanitizeSearch } from "@/lib/learning/search";
import type { Profile, Role } from "@/types/app";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

const ROLES: Role[] = ["student", "teacher", "admin"];

const USERS_PER_PAGE = 50;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; p?: string | string[] }>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = sanitizeSearch(first(params.q));
  const page = parsePage(first(params.p));
  const from = (page - 1) * USERS_PER_PAGE;

  const session = await requireRole("admin");
  const supabase = await createClient();

  // Admin-only RLS policy allows reading all profiles. Emails are never selected here.
  let listQuery = supabase
    .from("profiles")
    .select("id, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + USERS_PER_PAGE - 1);
  if (q) listQuery = listQuery.ilike("full_name", `%${q}%`);
  const { data, count } = await listQuery;
  const users = (data ?? []) as Pick<Profile, "id" | "full_name" | "role" | "created_at">[];
  const total = count ?? users.length;
  const pages = Math.max(1, Math.ceil(total / USERS_PER_PAGE));

  // Role totals cover everyone, not just the page being shown.
  const counts = await Promise.all(
    ROLES.map(async (role) => {
      const { count: c } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", role);
      return { role, count: c ?? 0 };
    }),
  );
  const pageHref = (n: number) => `/dashboard/admin?${new URLSearchParams({ ...(q ? { q } : {}), p: String(n) }).toString()}#users`;

  return (
    <DashboardShell session={session}>
      <Welcome
        name={session.profile.full_name}
        subtitle="Manage user roles. Every change is verified on the server and enforced again by the database."
      />

      <ul className="mb-10 grid gap-4 sm:grid-cols-3">
        {counts.map(({ role, count }) => (
          <li key={role}>
            <Card>
              <CardBody className="p-4">
                <p className="text-sm capitalize text-forest-600">{role}s</p>
                <p className="mt-1 text-3xl font-extrabold">{count}</p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      <section id="users" aria-labelledby="users-h">
        <SectionHeading>
          <span id="users-h">Users</span>
        </SectionHeading>
        <form method="get" action="/dashboard/admin#users" role="search" className="mb-3 flex gap-2">
          <label htmlFor="user-search" className="sr-only">Search users by name</label>
          <input
            id="user-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name"
            className="h-11 w-full max-w-xs rounded-xl border border-sage-300 bg-white px-3.5 text-base text-forest-900 sm:text-sm"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <div className="overflow-x-auto rounded-card border border-sage-200 bg-white shadow-card">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Registered users and their roles</caption>
            <thead className="border-b border-sage-200 bg-sage-50 text-xs uppercase tracking-wide text-forest-600">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.full_name || "(no name)"}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.id === session.userId ? (
                      <span className="text-forest-500">This is you</span>
                    ) : (
                      <form action={setUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <label className="sr-only" htmlFor={`role-${u.id}`}>
                          Role for {u.full_name || "user"}
                        </label>
                        <select
                          id={`role-${u.id}`}
                          name="role"
                          defaultValue={u.role}
                          className="h-9 rounded-lg border border-sage-300 bg-white px-2 text-sm capitalize"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="secondary">
                          Save
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className="mt-3 text-sm text-forest-600">No users match that search.</p>}
        {pages > 1 && (
          <nav aria-label="Users pages" className="mt-4 flex items-center justify-between text-sm">
            <span className="text-forest-600">Page {Math.min(page, pages)} of {pages} · {total} users</span>
            <span className="flex gap-2">
              {page > 1 && <Link href={pageHref(page - 1)} className="rounded-lg border border-sage-300 bg-white px-3 py-2 font-semibold hover:bg-sage-50">Previous</Link>}
              {page < pages && <Link href={pageHref(page + 1)} className="rounded-lg border border-sage-300 bg-white px-3 py-2 font-semibold hover:bg-sage-50">Next</Link>}
            </span>
          </nav>
        )}
      </section>
    </DashboardShell>
  );
}
