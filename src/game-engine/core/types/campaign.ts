import type {
    CampaignId,
    EncounterId,
    PlayerId,
} from "./common";

export interface EncounterDefinition {
    id: EncounterId;
    name: string;

    description?: string;

    masterId: string;

    order: number;
}

export interface CampaignDefinition {
    id: CampaignId;
    name: string;

    encounters: EncounterDefinition[];
}

export interface CampaignProgress {
    campaignId: CampaignId;

    currentEncounterId: EncounterId;

    completeEncounters: EncounterId[];

    playerIds: PlayerId[];
}