import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { SalesTeamService } from "../interfaces";

export async function getOverview() {
  await delay();
  return store.getSalesTeamOverview();
}

export async function getSalespeople() {
  await delay();
  return store.getSalesTeamRows();
}

export async function getSalesperson(id: string) {
  await delay();
  const detail = store.getSalespersonDetail(id);
  if (!detail) throw new Error("Salesperson not found");
  return detail;
}

export async function getTeamMember360(memberId: string) {
  await delay();
  const data = store.getTeamMember360Data(memberId);
  if (!data) throw new Error("Team member not accessible");
  return data;
}

export class MockSalesTeamService implements SalesTeamService {
  getOverview = getOverview;
  getSalespeople = getSalespeople;
  getSalesperson = getSalesperson;
  getTeamMember360 = getTeamMember360;
}
