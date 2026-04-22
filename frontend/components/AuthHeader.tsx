"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Fish, MapPin, ShieldCheck, User, UserCheck } from "lucide-react";
import {
  AuthSession,
  clearAuthSession,
  loginWithAuthSession,
  readAuthSession,
  subscribeAuthSession,
} from "@/lib/auth-session";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AuthHeader() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void readAuthSession().then((activeSession) => {
      setSession(activeSession);
    });

    return subscribeAuthSession((nextSession) => {
      setSession(nextSession);
    });
  }, []);

  const isAdmin = session?.user.role === "ADMIN";

  const roleLabel = useMemo(() => {
    if (!session) {
      return null;
    }

    return isAdmin ? "Admin" : "Pelanggan";
  }, [isAdmin, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const nextSession = await loginWithAuthSession(email, password);
      setSession(nextSession);
      setOpen(false);
      setPassword("");
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Tidak bisa login. Coba lagi beberapa saat.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setSession(null);
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="group flex cursor-pointer items-center gap-2">
          <div className="rounded-xl bg-emerald-600 p-2 text-white transition-transform group-hover:rotate-12">
            <Fish size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              FISHBOOKER
            </h1>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <MapPin size={10} /> Gunung Putri, Bogor
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#pond-map" className="transition-colors hover:text-emerald-600">
            Denah Kolam
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin/dashboard"
                className="transition-colors hover:text-emerald-600"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/slots"
                className="transition-colors hover:text-emerald-600"
              >
                Kelola Slot
              </Link>
            </>
          ) : (
            <Link
              href="/bookings"
              className="transition-colors hover:text-emerald-600"
            >
              Riwayat Booking
            </Link>
          )}
          <Link href="/#bantuan" className="transition-colors hover:text-emerald-600">
            Bantuan
          </Link>
        </div>

        {session ? (
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 sm:px-4">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold uppercase leading-none text-slate-400">
                Login sebagai
              </p>
              <p className="text-xs font-bold leading-tight text-slate-700">
                {session.user.name}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                {isAdmin ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <UserCheck className="h-3 w-3" />
                )}
                {roleLabel}
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
              <User size={18} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-slate-300 bg-white text-slate-700"
              onClick={() => void handleLogout()}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700">
                Login
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                  Masuk ke FishBooker
                </DialogTitle>
                <DialogDescription>
                  Gunakan akun API kamu untuk booking dan akses fitur berbasis
                  role.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-emerald-200 transition focus:border-emerald-500 focus:ring-2"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-emerald-200 transition focus:border-emerald-500 focus:ring-2"
                    required
                  />
                </div>

                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {error}
                  </p>
                ) : null}

                <DialogFooter className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={loading}
                  >
                    {loading ? "Memproses..." : "Login"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </nav>
  );
}
