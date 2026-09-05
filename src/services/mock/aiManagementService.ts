import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type {
  AIConfiguration,
  AICapabilityDefinition,
  AIExecutionFilters,
  AIExecutionRecord,
  AIProviderDefinition,
  AIModelDefinition,
  AIStatusSummary,
  AIUsageFilters,
  AIUsageSummary,
  RunCapabilityInput,
} from "@/store/ai";

export async function getConfiguration() {
  await delay();
  return store.getAIConfiguration();
}

export async function updateConfiguration(data: Partial<AIConfiguration>) {
  await delay();
  return store.updateAIConfiguration(data);
}

export async function getProviders() {
  await delay();
  return store.getAIProviders();
}

export async function getModels() {
  await delay();
  return store.getAIModels();
}

export async function getCapabilities() {
  await delay();
  return store.getAICapabilities();
}

export async function getCapability(id: string) {
  await delay();
  return store.getAICapability(id);
}

export async function updateCapability(id: string, data: Partial<AICapabilityDefinition>) {
  await delay();
  return store.updateAICapability(id, data);
}

export async function getExecutions(filters?: AIExecutionFilters) {
  await delay();
  return store.getAIExecutions(filters);
}

export async function getExecution(id: string) {
  await delay();
  return store.getAIExecution(id);
}

export async function getUsage(filters?: AIUsageFilters) {
  await delay();
  return store.getAIUsage(filters);
}

export async function getAIStatus() {
  await delay();
  return store.getAIStatus();
}

export async function runCapability(input: RunCapabilityInput) {
  await delay(300);
  return store.runAICapability(input);
}

export async function retryExecution(executionId: string) {
  await delay(300);
  return store.retryAIExecution(executionId);
}

export async function approveExecution(executionId: string) {
  await delay();
  return store.approveAIExecution(executionId);
}

export async function rejectExecution(executionId: string, reason?: string) {
  await delay();
  return store.rejectAIExecution(executionId, reason);
}
