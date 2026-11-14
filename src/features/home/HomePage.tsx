import { Swords } from "lucide-react";
import { useState } from "react";
import type { GameAction, GameState } from "../../game-engine/core";
import { applyAction } from "../../game-engine/core";
import { createSoloCampaign } from "../../game-content/create-solo-campaign";
import { CampaignSetup, type CampaignOptions } from "../campaign/CampaignSetup";
import { CampaignBoard } from "../campaign/CampaignBoard";
import "../campaign/campaign.css";

export function HomePage() {
  const [stage, setStage] = useState<"home" | "setup" | "game">("home");
  const [game, setGame] = useState<GameState | null>(null);
  const [options, setOptions] = useState<CampaignOptions | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  function start(nextOptions: CampaignOptions) {
    try {
      const next = createSoloCampaign(
        nextOptions.characterClass,
        nextOptions.name,
        nextOptions.seed,
      );
      setOptions(nextOptions);
      setGame(next);
      setStage("game");
      setAttempt((value) => value + 1);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de lancer la rencontre.",
      );
    }
  }

  function dispatch(action: GameAction): boolean {
    if (!game) return false;
    try {
      const next = applyAction(game, action);
      setGame(next);
      setError("");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
      return false;
    }
  }

  if (stage === "setup")
    return (
      <CampaignSetup
        onStart={start}
        onBack={() => {
          setStage("home");
          setError("");
        }}
        error={error}
      />
    );
  if (stage === "game" && game && options)
    return (
      <CampaignBoard
        key={attempt}
        game={game}
        onAction={dispatch}
        onRestart={() => start(options)}
        onExit={() => {
          setStage("setup");
          setGame(null);
          setError("");
        }}
        error={error}
      />
    );
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md text-center">
        <Swords size={64} className="mx-auto mb-6 text-amber-400" />

        <h1 className="mb-2 text-5xl font-bold tracking-wider text-amber-300">
          HERO REALMS
        </h1>

        <p className="mb-12 text-lg text-slate-400">Compagnon de campagne</p>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStage("setup")}
            className="rounded-lg bg-amber-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            Nouvelle campagne
          </button>

          <p className="text-sm text-slate-400">
            Une rencontre solo, cinq classes au choix. Cartes et scénario
            fictifs pour ce prototype.
          </p>
        </div>

        <p className="mt-12 text-sm text-slate-500">
          Prototype personnel · Parties non sauvegardées
        </p>
      </div>
    </main>
  );
}
