import type { ReactNode } from "react";
import type { CardDefinition } from "../../game-engine/core";
import { describeEffect, factionNames } from "./card-text";

export function CardView({
  definition,
  children,
  exhausted = false,
}: {
  definition: CardDefinition;
  children?: ReactNode;
  exhausted?: boolean;
}) {
  return (
    <article
      className={`game-card faction-${definition.faction ?? "neutral"} ${exhausted ? "exhausted" : ""}`}
    >
      <div className="card-meta">
        <span>
          {definition.faction ? factionNames[definition.faction] : "Neutre"}
        </span>
        <span>{definition.cost} or</span>
      </div>
      <h3>{definition.name}</h3>
      <p className="card-type">
        {definition.type === "champion"
          ? `Champion · ${definition.defense} défense${definition.isGuard ? " · Garde" : ""}`
          : definition.type === "item"
            ? "Objet"
            : "Action"}
      </p>
      <ul className="card-effects">
        {definition.abilities.map((ability) => (
          <li key={ability.id}>
            <strong>
              {ability.trigger === "ally"
                ? "Allié : "
                : ability.trigger === "onSacrifice"
                  ? "Sacrifice : "
                  : ability.trigger === "activated"
                    ? "Activer : "
                    : ""}
            </strong>
            {ability.effects.map(describeEffect).join(" · ")}
            {ability.optional ? " (facultatif)" : ""}
          </li>
        ))}
      </ul>
      {exhausted && <p className="card-type">Épuisé</p>}
      <div className="card-controls">{children}</div>
    </article>
  );
}
