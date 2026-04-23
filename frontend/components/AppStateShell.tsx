import type { ReactNode } from "react";

interface AppStateShellProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function AppStateShell({
  eyebrow,
  title,
  description,
  actions,
}: AppStateShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <div className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-100/80">
          <div className="border-b border-slate-100 bg-slate-950 px-8 py-7 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              {title}
            </h1>
          </div>

          <div className="px-8 py-7">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>

            {actions ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
