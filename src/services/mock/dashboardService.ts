import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getDashboardMetrics() {
  await delay();
  return store.getDashboardMetrics();
}

export async function getManagerDashboardData() {
  await delay();
  return store.getManagerDashboardData();
}

export async function getPipeline() {
  await delay();
  return store.getPipeline();
}

export async function getAttentionDeals() {
  await delay();
  return store.getAttentionDealsList();
}

export async function getActivities(filters?: Parameters<typeof store.getActivities>[0]) {
  await delay();
  return store.getActivities(filters);
}

export async function getTeamPerformance() {
  await delay();
  return store.getTeamPerformance();
}

export async function getRevenueChartData() {
  await delay();
  return store.getRevenueChartData();
}

export async function getReportMetrics() {
  await delay();
  return store.getDashboardMetrics();
}
