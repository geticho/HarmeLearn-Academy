import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_ROLES, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Server-side guard for the whole Admin Console.
 * The role is read from the database session, never from the browser,
 * so a non-admin cannot reach these pages by editing localStorage.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    redirect("/not-authorized");
  }

  return (
    <AdminShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
