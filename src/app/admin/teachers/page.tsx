import UserManager from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default function AdminTeachersPage() {
  return (
    <UserManager
      role="teacher"
      heading="Teachers"
      blurb="Only an administrator can register a teacher. Teachers created here are automatically marked as verified and can be assigned to courses."
    />
  );
}
