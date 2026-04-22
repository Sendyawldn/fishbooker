import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PaymentPageClient from "@/features/payments/components/PaymentPageClient";
import { readServerAuthSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "FishBooker Payment",
  description:
    "Halaman pembayaran booking dengan sandbox webhook dan konfirmasi status real-time.",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const session = await readServerAuthSession();

  if (!session) {
    redirect("/");
  }

  const { reference } = await params;

  return <PaymentPageClient reference={reference} />;
}
