import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getReportMetrics() {
  await delay();
  return store.getDashboardMetrics();
}

export async function getTeamPerformance() {
  await delay();
  return store.getTeamPerformance();
}

export async function getRevenueChartData() {
  await delay();
  return store.getRevenueChartData();
}

export async function getPipeline() {
  await delay();
  return store.getPipeline();
}
