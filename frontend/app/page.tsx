import { getSlots } from "@/lib/api";
import InteractivePondSection from "@/components/InteractivePondSection";
import AuthHeader from "@/components/AuthHeader";
import type { Slot } from "@/lib/api";
import { Waves } from "lucide-react";

export default async function HomePage() {
  let slots: Slot[] = [];
  let availableCount = 0;

  try {
    slots = await getSlots();
    availableCount = slots.filter((s) => s.status === "TERSEDIA").length;
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 p-10">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-rose-100">
          <h1 className="text-2xl font-bold text-rose-600 mb-2">
            Backend Belum Siap
          </h1>
          <p className="text-slate-500">
            Pastikan Laravel Sail kamu sudah menyala (sail up -d).
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AuthHeader />

      {/* 2. Hero Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="relative bg-slate-900 rounded-[2rem] p-8 md:p-12 overflow-hidden shadow-2xl shadow-emerald-100">
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <Waves size={14} /> Sesi Memancing Pagi
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1]">
                Siap Strike Hari Ini?{" "}
                <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8 italic">
                  Pilih Lapakmu.
                </span>
              </h2>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-32 bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-center">
                <p className="text-3xl font-black text-white">{slots.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  Total Lapak
                </p>
              </div>
              <div className="flex-1 md:w-32 bg-emerald-500 p-5 rounded-2xl text-center shadow-lg shadow-emerald-500/20">
                <p className="text-3xl font-black text-white">
                  {availableCount}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase text-emerald-100">
                  Tersedia
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Slot Grid Section */}
        <div className="mt-16" id="pond-map">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Peta Denah Kolam
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Klik titik lapak di denah, lalu konfirmasi booking dari panel
                detail
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Ready
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Hold
                </span>
              </div>
            </div>
          </div>

          <InteractivePondSection slots={slots} />
        </div>
      </section>

      {/* Footer minimalis */}
      <footer className="py-12 text-center border-t border-slate-100 mt-20" id="bantuan">
        <p className="text-slate-400 text-xs font-medium">
          © 2026 FishBooker Pro • Built for Final Project UBSI
        </p>
      </footer>
    </main>
  );
}
