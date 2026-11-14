import { useState } from "react";
import {
  canActivateAlly,
  canActivateChampion,
  canUseCharacterPower,
  canTargetCampaignMaster,
  canTargetCampaignMinion,
  type GameState,
  type GameAction,
} from "../../game-engine/core";
import { CardView } from "./CardView";
import { classNames } from "./card-text";

export function CampaignBoard({
  game,
  onAction,
  onRestart,
  onExit,
  error,
}: {
  game: GameState;
  onAction: (action: GameAction) => boolean;
  onRestart: () => void;
  onExit: () => void;
  error: string;
}) {
  const [amount, setAmount] = useState("1");
  const [selection, setSelection] = useState<string[]>([]);
  const player = game.players[game.activePlayerId];
  const encounter = game.campaignEncounter!;
  const master = encounter.master;
  const masterDefinition = encounter.content.masters[master.definitionId];
  const choice = game.resolution.pendingChoice;
  const masterChoice = encounter.pendingChoice;
  const ended = game.status === "victory" || game.status === "defeat";
  const canAct = !ended && game.phase === "main" && !choice && !masterChoice;
  const attackAmount = Number(amount);
  const validAmount =
    canAct &&
    Number.isSafeInteger(attackAmount) &&
    attackAmount > 0 &&
    attackAmount <= player.resources.combat;
  const dispatch = (action: GameAction) => onAction(action);
  const cardName = (id: string) =>
    game.cardDefinitions[game.cards[id].definitionId].name;
  const activeMinions = Object.values(encounter.minions).filter(
    (minion) => !minion.defeated,
  );

  function renderCard(
    id: string,
    zone: "hand" | "inPlay" | "champions" | "market",
  ) {
    const card = game.cards[id];
    const definition = game.cardDefinitions[card.definitionId];
    return (
      <CardView key={id} definition={definition} exhausted={card.exhausted}>
        {zone === "hand" && (
          <button
            disabled={!canAct}
            onClick={() =>
              dispatch({ type: "PLAY_CARD", playerId: player.id, cardId: id })
            }
          >
            Jouer {definition.name}
          </button>
        )}
        {zone === "market" && (
          <button
            disabled={!canAct || player.resources.gold < definition.cost}
            onClick={() =>
              dispatch({ type: "BUY_CARD", playerId: player.id, cardId: id })
            }
          >
            Acheter {definition.name}
          </button>
        )}
        {(zone === "inPlay" || zone === "champions") &&
          definition.abilities
            .filter((ability) => ability.trigger !== "onPlay")
            .map((ability) => {
              const available =
                ability.trigger === "ally"
                  ? canActivateAlly(game, player.id, id, ability.id)
                  : ability.trigger === "activated"
                    ? canActivateChampion(game, player.id, id, ability.id)
                    : canAct;
              return (
                <button
                  key={ability.id}
                  disabled={!canAct || !available}
                  onClick={() =>
                    dispatch({
                      type:
                        ability.trigger === "ally"
                          ? "ACTIVATE_ALLY"
                          : ability.trigger === "activated"
                            ? "USE_CHAMPION"
                            : "SACRIFICE_CARD",
                      playerId: player.id,
                      cardId: id,
                      abilityId: ability.id,
                    })
                  }
                >
                  {ability.trigger === "ally"
                    ? "Allié"
                    : ability.trigger === "activated"
                      ? "Activer"
                      : "Sacrifier"}{" "}
                  {definition.name}
                </button>
              );
            })}
      </CardView>
    );
  }

  return (
    <main className="campaign-board">
      <header className="board-header">
        <div>
          <p className="eyebrow">Hero Realms · Rencontre solo</p>
          <h1>L’Autel des Ombres</h1>
          <p className="muted">
            Contenu fictif · {player.name}, {classNames[player.characterClass]}{" "}
            · Graine {game.id.replace("solo-", "")}
          </p>
        </div>
        <button className="quiet-button" onClick={onExit}>
          Quitter la rencontre
        </button>
      </header>
      <section className="resource-bar" aria-label="État du héros">
        <strong>Santé : {player.health}</strong>
        <strong>Or : {player.resources.gold}</strong>
        <strong>Combat : {player.resources.combat}</strong>
        <span>
          Tour {game.turnNumber} ·{" "}
          {ended
            ? "Rencontre terminée"
            : game.phase === "master"
              ? "Étape du Maître"
              : "Phase du héros"}
        </span>
        <button
          className="primary-button"
          disabled={!canAct}
          onClick={() => dispatch({ type: "END_TURN", playerId: player.id })}
        >
          Terminer le tour
        </button>
      </section>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {ended && (
        <section className={`result-panel ${game.status}`} role="status">
          <h2>{game.status === "victory" ? "Victoire !" : "Défaite"}</h2>
          <p>
            {game.status === "victory"
              ? "Le Seigneur des Ombres est vaincu."
              : "Votre héros est tombé face aux ombres."}
          </p>
          <button className="primary-button" onClick={onRestart}>
            Rejouer la même rencontre
          </button>
          <button className="quiet-button" onClick={onExit}>
            Choisir un autre héros
          </button>
        </section>
      )}
      {choice && (
        <section
          className="decision-panel"
          aria-labelledby="choice-title"
          key={choice.id}
        >
          <h2 id="choice-title">
            {choice.type === "selectCards"
              ? `Choisissez ${choice.amount} carte(s)`
              : "Capacité facultative"}
          </h2>
          {choice.type === "optionalAbility" ? (
            <>
              <p>
                Utiliser la capacité de{" "}
                {game.cards[choice.context.sourceCardId]
                  ? cardName(choice.context.sourceCardId)
                  : "votre pouvoir"}{" "}
                ?
              </p>
              {[true, false].map((accept) => (
                <button
                  key={String(accept)}
                  onClick={() =>
                    dispatch({
                      type: "RESOLVE_OPTIONAL_ABILITY",
                      playerId: player.id,
                      choiceId: choice.id,
                      accept,
                    })
                  }
                >
                  {accept ? "Utiliser" : "Passer"}
                </button>
              ))}
            </>
          ) : (
            <>
              <p>
                {choice.action === "discard"
                  ? "Défausser"
                  : choice.action === "stun"
                    ? "Assommer"
                    : "Sacrifier"}{" "}
                depuis{" "}
                {choice.from === "hand"
                  ? "la main"
                  : choice.from === "champions"
                    ? "les champions"
                    : "la défausse"}
                .
              </p>
              <div className="choice-cards">
                {choice.availableCardIds.map((id) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={selection.includes(id)}
                      onChange={(event) =>
                        setSelection(
                          event.target.checked
                            ? [...selection, id]
                            : selection.filter((selected) => selected !== id),
                        )
                      }
                    />
                    {cardName(id)}
                  </label>
                ))}
              </div>
              <button
                disabled={selection.length !== choice.amount}
                onClick={() => {
                  if (
                    dispatch({
                      type: "RESOLVE_CHOICE",
                      playerId: player.id,
                      choiceId: choice.id,
                      selectedCardIds: selection,
                    })
                  )
                    setSelection([]);
                }}
              >
                Confirmer le choix
              </button>
            </>
          )}
        </section>
      )}
      {masterChoice && (
        <section
          className="decision-panel"
          aria-labelledby="master-choice-title"
        >
          <h2 id="master-choice-title">Décision pendant l’étape du Maître</h2>
          <p>{masterChoice.message}</p>
          {masterChoice.availableIds.map((id) => (
            <button
              key={id}
              onClick={() =>
                dispatch({
                  type: "RESOLVE_MASTER_CHOICE",
                  playerId: player.id,
                  choiceId: masterChoice.id,
                  selectedId: id,
                })
              }
            >
              {masterChoice.kind === "minionOrder"
                ? encounter.content.minions[encounter.minions[id].definitionId]
                    .name
                : cardName(id)}
            </button>
          ))}
        </section>
      )}
      <div className="board-columns">
        <div className="play-area">
          <section className="board-section">
            <div className="section-heading">
              <h2>Ennemis</h2>
              <label>
                Combat par attaque{" "}
                <input
                  className="attack-input"
                  aria-label="Combat par attaque"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
            </div>
            <div className="enemy-grid">
              <article className="enemy-card master-card">
                <p className="eyebrow">Maître · Niveau {master.level}</p>
                <h3>{masterDefinition.name}</h3>
                <p className="enemy-health">{master.health} santé</p>
                <p>
                  {master.masteryCardIds.length} maîtrise(s) · Deck{" "}
                  {master.deck.length} · Défausse {master.discard.length}
                </p>
                <button
                  disabled={
                    !validAmount ||
                    !canTargetCampaignMaster(encounter, player.id)
                  }
                  onClick={() =>
                    dispatch({
                      type: "ATTACK_CAMPAIGN_MASTER",
                      playerId: player.id,
                      combat: attackAmount,
                    })
                  }
                >
                  Attaquer le Maître
                </button>
              </article>
              {activeMinions.map((minion) => {
                const definition =
                  encounter.content.minions[minion.definitionId];
                return (
                  <article className="enemy-card" key={minion.id}>
                    <p className="eyebrow">
                      {minion.zoneOwnerId === "master"
                        ? "Zone du Maître · Élite"
                        : "Votre zone"}
                      {minion.isGuard ? " · Garde" : ""}
                    </p>
                    <h3>{definition.name}</h3>
                    <p>
                      {minion.health} défense restante · {definition.attack}{" "}
                      combat
                    </p>
                    <p>{minion.exhausted ? "Épuisé" : "Mobilisé"}</p>
                    <button
                      disabled={
                        !validAmount ||
                        !canTargetCampaignMinion(
                          encounter,
                          minion.id,
                          player.id,
                        )
                      }
                      onClick={() =>
                        dispatch({
                          type: "ATTACK_CAMPAIGN_MINION",
                          playerId: player.id,
                          minionId: minion.id,
                          combat: attackAmount,
                        })
                      }
                    >
                      Attaquer {definition.name}
                    </button>
                  </article>
                );
              })}
            </div>
            {!canTargetCampaignMaster(encounter, player.id) &&
              !master.defeated && (
                <p className="muted">
                  Les sbires mobilisés de votre zone et les gardes auprès du
                  Maître limitent vos cibles.
                </p>
              )}
            {Object.values(encounter.hazards)
              .filter((hazard) => hazard.active)
              .map((hazard) => {
                const definition =
                  encounter.content.hazards[hazard.definitionId];
                const cost = definition.clearCost;
                return (
                  <article className="hazard-card" key={hazard.id}>
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                    <button
                      disabled={
                        !canAct ||
                        !cost ||
                        player.resources[cost.resource] < cost.amount
                      }
                      onClick={() =>
                        dispatch({
                          type: "CLEAR_HAZARD",
                          playerId: player.id,
                          hazardId: hazard.id,
                        })
                      }
                    >
                      Dissiper{" "}
                      {cost
                        ? `(${cost.amount} ${cost.resource === "gold" ? "or" : "combat"})`
                        : ""}
                    </button>
                  </article>
                );
              })}
          </section>
          <section className="board-section">
            <h2>Marché</h2>
            <div className="card-grid">
              {game.market.row.map((id) => renderCard(id, "market"))}
            </div>
            <div className="supply-row">
              <span>
                Deck marché : {game.market.deck.length} cartes · Gemmes de feu :{" "}
                {game.market.fireGems.length}
              </span>
              <button
                disabled={
                  !canAct ||
                  player.resources.gold < 2 ||
                  !game.market.fireGems.length
                }
                onClick={() =>
                  dispatch({
                    type: "BUY_CARD",
                    playerId: player.id,
                    cardId: game.market.fireGems[0],
                  })
                }
              >
                Acheter une Gemme de feu (2 or)
              </button>
              <span className="muted">
                Gemme : +2 or en la jouant, puis sacrifice possible pour +3
                combat.
              </span>
            </div>
          </section>
          <section className="board-section">
            <h2>
              Votre main{" "}
              <span className="count">{player.zones.hand.length}</span>
            </h2>
            <div className="card-grid">
              {player.zones.hand.map((id) => renderCard(id, "hand"))}
            </div>
            {!player.zones.hand.length && (
              <p className="muted">Votre main est vide.</p>
            )}
          </section>
          <section className="board-section">
            <h2>En jeu</h2>
            <div className="card-grid">
              {player.zones.champions.map((id) => renderCard(id, "champions"))}
              {player.zones.inPlay.map((id) => renderCard(id, "inPlay"))}
            </div>
          </section>
        </div>
        <aside>
          <section className="board-section">
            <h2>Pouvoirs</h2>
            {player.powers.availablePowerIds.map((id) => {
              const power = game.powerDefinitions[id];
              const used = player.powers.usedThisEncounter.includes(id);
              return (
                <article className="power-card" key={id}>
                  <h3>{power.name}</h3>
                  <p>{power.description}</p>
                  <p className="muted">
                    {power.usage === "oncePerTurn"
                      ? "Une fois par tour"
                      : "Une fois par rencontre"}
                    {power.cost.type !== "none"
                      ? ` · ${power.cost.amount} ${power.cost.type === "gold" ? "or" : "combat"}`
                      : ""}
                  </p>
                  <button
                    disabled={
                      !canAct || !canUseCharacterPower(game, player.id, id)
                    }
                    onClick={() =>
                      dispatch({
                        type: "USE_CHARACTER_POWER",
                        playerId: player.id,
                        powerId: id,
                      })
                    }
                  >
                    {used ? "Déjà utilisé" : `Utiliser ${power.name}`}
                  </button>
                </article>
              );
            })}
          </section>
          <section className="board-section">
            <h2>Vos piles</h2>
            <p>Pioche : {player.zones.deck.length}</p>
            <details>
              <summary>Défausse : {player.zones.discard.length}</summary>
              <ul>
                {player.zones.discard.map((id) => (
                  <li key={id}>{cardName(id)}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Sacrifices : {player.zones.sacrificed.length}</summary>
              <ul>
                {player.zones.sacrificed.map((id) => (
                  <li key={id}>{cardName(id)}</li>
                ))}
              </ul>
            </details>
          </section>
          <section className="board-section">
            <h2>Dernière révélation</h2>
            {encounter.revealedCardIds.map((id, index) => (
              <p key={`${id}-${index}`}>
                {encounter.content.masterCards![id].name}
              </p>
            ))}
          </section>
          <section className="board-section">
            <h2>Journal de rencontre</h2>
            <ol className="game-log" aria-label="Journal de rencontre">
              {game.log.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ol>
          </section>
          <section className="board-section muted">
            <h2>Aide</h2>
            <p>
              Jouez vos cartes, utilisez vos pouvoirs, recrutez au marché et
              dépensez votre combat. Les achats rejoignent votre défausse.
            </p>
            <p>
              Les champions restent en jeu. En fin de tour, votre main est
              renouvelée, vos champions se mobilisent et le Maître agit.
            </p>
            <p>Cette version ne conserve pas la partie après fermeture.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
