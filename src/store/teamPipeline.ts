import type { DealStage, User } from "@/types";
import type { CRMState } from "./types";
import { getPipelineData } from "./helpers";
import { getTeamDeals, getTeamDealsSummary } from "./teamDeals";

export interface TeamPipelineStageSummary {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
}

export interface TeamPipelineSummary {
  totalPipelineValue: number;
  totalDeals: number;
  activeDeals: number;
  wonValue: number;
  stages: TeamPipelineStageSummary[];
}

export function getTeamPipelineSummary(state: CRMState, manager: User): TeamPipelineSummary {
  const deals = getTeamDeals(state, manager);
  const dealSummary = getTeamDealsSummary(state, manager);
  const scopedState = { ...state, deals };
  const stages = getPipelineData(scopedState).map((stage) => ({
    stage: stage.stage,
    label: stage.label,
    count: stage.count,
    value: stage.value,
  }));
  return {
    totalPipelineValue: dealSummary.pipelineValue,
    totalDeals: dealSummary.totalDeals,
    activeDeals: dealSummary.activeCount,
    wonValue: dealSummary.wonValue,
    stages,
  };
}
