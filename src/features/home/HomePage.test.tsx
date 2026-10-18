import { render, screen } from "@testing-library/react";
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

  it("affiche les actions principales", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("button", {
        name: "Nouvelle campagne",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Continuer",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Paramètres",
      }),
    ).toBeDisabled();
  });
});