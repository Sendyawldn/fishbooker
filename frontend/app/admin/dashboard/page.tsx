import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboardPageClient from "@/features/admin-dashboard/components/AdminDashboardPageClient";
import { readServerAuthSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "FishBooker Admin Dashboard",
  description:
    "Dashboard admin untuk memantau transaksi, occupancy, dan pembayaran tunai.",
};

export default async function AdminDashboardPage() {
  const session = await readServerAuthSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminDashboardPageClient />;
}
