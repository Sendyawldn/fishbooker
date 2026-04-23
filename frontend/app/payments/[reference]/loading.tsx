import AppStateShell from "@/components/AppStateShell";

export default function PaymentLoading() {
  return (
    <AppStateShell
      eyebrow="Payments"
      title="Mengecek status pembayaran"
      description="Kami sedang memuat detail pembayaran, waktu hold, dan status settlement terbaru."
    />
  );
}
