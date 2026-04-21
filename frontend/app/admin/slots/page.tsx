import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSlotsPageClient from "@/features/admin-slots/components/AdminSlotsPageClient";
import { readServerAuthSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "FishBooker Admin Slots",
  description: "Panel admin untuk mengelola harga dan status lapak.",
};

export default async function AdminSlotsPage() {
  const session = await readServerAuthSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminSlotsPageClient />;
}
