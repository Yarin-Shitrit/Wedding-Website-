import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;
  if (session) redirect(params.next || "/admin/dashboard");

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-center mb-6">
          {he.admin.loginTitle}
        </h1>
        <AdminLoginForm next={params.next} />
      </div>
    </div>
  );
}
