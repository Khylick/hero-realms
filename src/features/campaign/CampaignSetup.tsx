import { useState } from "react";
import type { PlayerClass } from "../../game-engine/core";
import { demoClasses } from "../../game-content/classes/demo-classes";
import { classNames } from "./card-text";

export interface CampaignOptions {
  characterClass: PlayerClass;
  name: string;
  seed: number;
}

export function CampaignSetup({
  onStart,
  onBack,
  error,
}: {
  onStart: (options: CampaignOptions) => void;
  onBack: () => void;
  error: string;
}) {
  const [characterClass, setCharacterClass] = useState<PlayerClass>("fighter");
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("42");
  return (
    <main className="campaign-setup">
      <button className="quiet-button" onClick={onBack}>
        ← Accueil
      </button>
      <p className="eyebrow">Rencontre solo · Prototype</p>
      <h1>Choisissez votre héros</h1>
      <p className="muted">
        L’Autel des Ombres · Réduisez la santé du Seigneur des Ombres à zéro.
      </p>
      <p className="prototype-note">
        Cartes, classes et scénario provisoires. Ils seront remplacés par le
        contenu officiel.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onStart({
            characterClass,
            name,
            seed: seed.trim() ? Number(seed) : NaN,
          });
        }}
      >
        <label className="field">
          Nom du héros
          <input
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aventurier"
          />
        </label>
        <fieldset className="class-picker">
          <legend>Classe</legend>
          {(Object.keys(classNames) as PlayerClass[]).map((id) => (
            <label
              key={id}
              className={`class-option ${id === characterClass ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="character-class"
                value={id}
                checked={id === characterClass}
                onChange={() => setCharacterClass(id)}
              />
              <strong>{classNames[id]}</strong>
              <span>{demoClasses[id].description}</span>
              <small>
                {demoClasses[id].startingStats.maxHealth} santé ·{" "}
                {demoClasses[id].startingDeck.length} cartes
              </small>
            </label>
          ))}
        </fieldset>
        <label className="field">
          Graine de partie
          <input
            type="number"
            min={0}
            max={4294967295}
            step={1}
            required
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
        <p className="muted">
          La même graine et les mêmes décisions reproduisent la même partie.
        </p>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <button className="primary-button" type="submit">
          Entrer dans la rencontre
        </button>
      </form>
    </main>
  );
}
