import AppStateShell from "@/components/AppStateShell";

export default function AdminLoading() {
  return (
    <AppStateShell
      eyebrow="Admin"
      title="Menyiapkan dashboard operasional"
      description="Kami sedang mengambil metrik occupancy, transaksi, dan status lapak terbaru untuk admin."
    />
  );
}
