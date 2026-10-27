
import type {
  CardId,
  EnemyId,
  PlayerId,
} from "./common";

export type GameAction =
  | {
      type: "START_GAME";
    }
  | {
      type: "PLAY_CARD";
      playerId: PlayerId;
      cardId: CardId;
    }
  | {
      type: "BUY_CARD";
      playerId: PlayerId;
      cardId: CardId;
    }
  | {
      type: "ATTACK_ENEMY";
      playerId: PlayerId;
      enemyId: EnemyId;
      amount: number;
    }
  | {
      type: "USE_CHAMPION";
      playerId: PlayerId;
      cardId: CardId;
      abilityId: string;
    }
  | {
      type: "END_TURN";
      playerId: PlayerId;
    }
  | {
      type: "RESOLVE_CHOICE";
      playerId: PlayerId;
      choiceId: string;
      selectedCardIds: CardId[];
    }
  | {
      type: "ACTIVATE_ALLY";
      playerId: PlayerId;
      cardId: CardId;
      abilityId: string;
    }
  | {
      type: "ATTACK_CHAMPION";
      playerId: PlayerId;
      targetPlayerId: PlayerId;
      cardId: CardId;
    }
  | {
      type: "ATTACK_PLAYER";
      playerId: PlayerId;
      targetPlayerId: PlayerId;
      amount: number;
    }
  | {
      type: "USE_CHARACTER_POWER";
      playerId: PlayerId;
      powerId: string;
    }
  | {
      type: "GAIN_EXPERIENCE";
      playerId: PlayerId;
      amount: number;
    }
  | {
    type: "ATTACK_CAMPAIGN_MINION";
    playerId: PlayerId;
    minionId: EnemyId;
    combat: number;
    }
  | {
    type: "ATTACK_CAMPAIGN_MASTER";
    playerId: PlayerId;
    combat: number;
    };
