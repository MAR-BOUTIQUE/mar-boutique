import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-[#F3EDE0]">
      <AdminSidebar />
      <main className="flex-1 ml-60 p-8 min-h-screen">{children}</main>
    </div>
  );
}
