import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("affiche le titre de l'application", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "HERO REALMS",
      }),
    ).toBeInTheDocument();
  });

  it("permet de choisir chacune des cinq classes et de lancer la rencontre", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await user.click(screen.getByRole("button", { name: "Nouvelle campagne" }));
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    await user.click(screen.getByRole("radio", { name: /Magicien/ }));
    await user.type(
      screen.getByRole("textbox", { name: "Nom du héros" }),
      "Merlin",
    );
    await user.click(
      screen.getByRole("button", { name: "Entrer dans la rencontre" }),
    );
    expect(
      screen.getByRole("heading", { name: "L’Autel des Ombres" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Merlin, Magicien/)).toBeInTheDocument();
    const state = screen.getByRole("region", { name: "État du héros" });
    expect(within(state).getByText(/Santé/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Marché" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pouvoirs" }),
    ).toBeInTheDocument();
  });

  it("joue une carte, passe au tour suivant et permet de changer de héros", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await user.click(screen.getByRole("button", { name: "Nouvelle campagne" }));
    await user.click(
      screen.getByRole("button", { name: "Entrer dans la rencontre" }),
    );
    const play = screen.getAllByRole("button", { name: /^Jouer / })[0];
    const handBefore = screen.getAllByRole("button", {
      name: /^Jouer /,
    }).length;
    await user.click(play);
    expect(screen.queryAllByRole("button", { name: /^Jouer / })).toHaveLength(
      handBefore - 1,
    );
    await user.click(screen.getByRole("button", { name: "Terminer le tour" }));
    expect(screen.getByText(/Tour 2 ·/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Quitter la rencontre" }),
    );
    expect(
      screen.getByRole("heading", { name: "Choisissez votre héros" }),
    ).toBeInTheDocument();
  });
});
