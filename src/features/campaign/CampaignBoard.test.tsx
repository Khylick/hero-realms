import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createSoloCampaign } from "../../game-content/create-solo-campaign";
import { applyAction } from "../../game-engine/core";
import { CampaignBoard } from "./CampaignBoard";

describe("Campaign result", () => {
  it.each(["victory", "defeat"] as const)(
    "désactive les actions après %s et réinitialise la rencontre",
    async (status) => {
      const user = userEvent.setup();
      const initial = createSoloCampaign("fighter", "Arthas", 42);
      initial.status = status;
      initial.phase = "ended";
      initial.campaignEncounter!.progress.status = status;
      initial.campaignEncounter!.pendingChoice = null;
      initial.resolution.pendingChoice = null;
      function Session() {
        const [game, setGame] = useState(initial);
        return (
          <CampaignBoard
            game={game}
            error=""
            onExit={() => undefined}
            onRestart={() =>
              setGame(createSoloCampaign("fighter", "Arthas", 42))
            }
            onAction={(action) => {
              setGame(applyAction(game, action));
              return true;
            }}
          />
        );
      }
      render(<Session />);
      expect(
        screen.getByRole("heading", {
          name: status === "victory" ? "Victoire !" : "Défaite",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Terminer le tour" }),
      ).toBeDisabled();
      await user.click(
        screen.getByRole("button", { name: "Rejouer la même rencontre" }),
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText(/Tour 1 ·/)).toBeInTheDocument();
      expect(
        screen.getByText("Gemmes de feu : 16", { exact: false }),
      ).toBeInTheDocument();
    },
  );
});
