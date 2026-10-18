
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
    };
