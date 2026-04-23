import AdminBookingControlsPageClient from "@/features/admin-controls/components/AdminBookingControlsPageClient";

export const metadata = {
  title: "Admin Booking Controls | FishBooker",
  description:
    "Kontrol operasional untuk kill switch reservasi, limit hold aktif, dan blacklist pelanggan.",
};

export default function AdminControlsPage() {
  return <AdminBookingControlsPageClient />;
}
