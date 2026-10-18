import { BookOpen, Settings, Swords } from "lucide-react";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md text-center">
        <Swords
          size={64}
          className="mx-auto mb-6 text-amber-400"
        />

        <h1 className="mb-2 text-5xl font-bold tracking-wider text-amber-300">
          HERO REALMS
        </h1>

        <p className="mb-12 text-lg text-slate-400">
          Compagnon de campagne
        </p>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            disabled
            className="rounded-lg bg-amber-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            Nouvelle campagne
          </button>

          <button
            type="button"
            disabled
            className="rounded-lg border border-amber-700 px-6 py-4 font-semibold text-amber-200 disabled:opacity-50"
          >
            <BookOpen className="mr-2 inline-block" size={20} />
            Continuer
          </button>

          <button
            type="button"
            disabled
            className="rounded-lg border border-slate-700 px-6 py-4 font-semibold text-slate-300 disabled:opacity-50"
          >
            <Settings className="mr-2 inline-block" size={20} />
            Paramètres
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-500">
          Prototype personnel — Version 0.1.0
        </p>
      </div>
    </main>
  );
}