import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminBookingsPageClient from "@/features/admin-bookings/components/AdminBookingsPageClient";
import { readServerAuthSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "FishBooker Admin Bookings",
  description: "Console admin untuk memantau dan membatalkan booking pending.",
};

export default async function AdminBookingsPage() {
  const session = await readServerAuthSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminBookingsPageClient />;
}
