import type { DashboardService, ReportService, SettingsService } from "../interfaces";
import * as dashboard from "./dashboardService";
import * as reports from "./reportService";
import * as settings from "./settingsService";

export class MockDashboardService implements DashboardService {
  getDashboardMetrics = dashboard.getDashboardMetrics;
  getManagerDashboardData = dashboard.getManagerDashboardData;
  getPipeline = dashboard.getPipeline;
  getAttentionDeals = dashboard.getAttentionDeals;
  getActivities = dashboard.getActivities;
  getTeamPerformance = dashboard.getTeamPerformance;
  getRevenueChartData = dashboard.getRevenueChartData;
}

export class MockReportService implements ReportService {
  getReportMetrics = reports.getReportMetrics;
  getTeamPerformance = reports.getTeamPerformance;
  getRevenueChartData = reports.getRevenueChartData;
  getPipeline = reports.getPipeline;
}

export class MockSettingsService implements SettingsService {
  getSettings = settings.getSettings;
  updateSettings = settings.updateSettings;
  resetDemoData = settings.resetDemoData;
  exportDemoData = settings.exportDemoData;
  search = settings.search;
}
