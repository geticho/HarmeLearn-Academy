import UserManager from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default function AdminStudentsPage() {
  return (
    <UserManager
      role="student"
      heading="Students"
      blurb="Student accounts can only be created here. There is no public sign-up — you create the account, then hand the student their email and temporary password."
    />
  );
}
