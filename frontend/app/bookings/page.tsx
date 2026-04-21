import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BookingHistoryPageClient from "@/features/bookings/components/BookingHistoryPageClient";
import { readServerAuthSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "FishBooker Booking History",
  description: "Riwayat booking aktif dan selesai untuk user yang sedang login.",
};

export default async function BookingHistoryPage() {
  const session = await readServerAuthSession();

  if (!session) {
    redirect("/");
  }

  return <BookingHistoryPageClient />;
}
