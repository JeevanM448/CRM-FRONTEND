import { generateId } from "./storage";

export type AIProviderId = "openai" | "future_provider";
export type AIProviderStatus = "not_connected" | "configured" | "error" | "disabled";
export type AIExecutionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "waiting_approval"
  | "cancelled";
export type AIApprovalPolicy = "always" | "below_threshold" | "never";
export type AIDataProcessingMode = "metadata_only" | "content_allowed" | "redacted";
export type AIUsagePeriod = "today" | "7d" | "30d" | "90d" | "all";

export interface AIConfiguration {
  id: string;
  enabled: boolean;
  provider: AIProviderId;
  providerStatus: AIProviderStatus;
  defaultModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  defaultConfidenceThreshold: number;
  requireApprovalBelowThreshold: boolean;
  approvalPolicy: AIApprovalPolicy;
  dataProcessingMode: AIDataProcessingMode;
  allowEmailAI: boolean;
  allowPOAI: boolean;
  allowDealAI: boolean;
  allowCustomerAI: boolean;
  allowAutomationAI: boolean;
  redactSensitiveData: boolean;
  allowProviderRetention: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, unknown>;
}

export interface AIProviderDefinition {
  id: AIProviderId;
  label: string;
  description?: string;
  status: AIProviderStatus;
  credentialStatus: "backend_required" | "configured_on_backend" | "not_configured";
}

export interface AIModelDefinition {
  id: string;
  provider: AIProviderId;
  displayName: string;
  capabilities: string[];
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  status: "active" | "deprecated";
}

export interface AICapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  modelId: string;
  confidenceThreshold: number;
  requiresApproval: boolean;
  approvalPolicy: AIApprovalPolicy;
  supportedProviders: AIProviderId[];
  supportedModels: string[];
  metadata?: Record<string, unknown>;
}

export interface AIExecutionRecord {
  id: string;
  capability: string;
  provider: AIProviderId;
  model: string;
  status: AIExecutionStatus;
  sourceType: string;
  sourceId: string;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  currency: string;
  confidence?: number;
  requiresApproval: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  errorMessage?: string;
  resultSummary?: string;
  automationExecutionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AIUsageFilters {
  period?: AIUsagePeriod;
  capability?: string;
  provider?: AIProviderId;
  model?: string;
  sourceType?: string;
}

export interface AIUsageSummary {
  period: AIUsagePeriod;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  waitingApproval: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  currency: string;
  averageLatencyMs: number;
  averageConfidence: number | null;
  successRate: number | null;
  byCapability: { capability: string; count: number; tokens: number; cost: number }[];
  byModel: { model: string; count: number; tokens: number; cost: number }[];
  byProvider: { provider: AIProviderId; count: number; tokens: number; cost: number }[];
  mockMode: boolean;
}

export interface AIStatusSummary {
  enabled: boolean;
  provider: AIProviderId;
  providerStatus: AIProviderStatus;
  providerLabel: string;
  enabledCapabilities: number;
  totalCapabilities: number;
  totalExecutions: number;
  successRate: number | null;
  mockMode: boolean;
  backendConnectionRequired: boolean;
}

export interface AIExecutionFilters {
  status?: AIExecutionStatus | "all";
  capability?: string;
  search?: string;
}

export interface RunCapabilityInput {
  capabilityId: string;
  sourceType: string;
  sourceId: string;
  automationExecutionId?: string;
  simulateFailure?: boolean;
  simulateLowConfidence?: boolean;
}

export const AI_CAPABILITY_CATEGORIES = [
  "Email",
  "Purchase Orders",
  "Deals",
  "Customers",
  "Follow-ups",
  "Sales",
  "Automation",
] as const;

export const AI_PROVIDERS: AIProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT models via secure backend integration",
    status: "not_connected",
    credentialStatus: "backend_required",
  },
];

export const AI_MODEL_REGISTRY: AIModelDefinition[] = [
  {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
    capabilities: [
      "EMAIL_CLASSIFICATION",
      "EMAIL_SUMMARIZATION",
      "EMAIL_REPLY_SUGGESTION",
      "FOLLOWUP_SUGGESTION",
      "CUSTOMER_SUMMARY",
    ],
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
    status: "active",
  },
  {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    capabilities: [
      "EMAIL_CLASSIFICATION",
      "EMAIL_SUMMARIZATION",
      "EMAIL_INTENT_DETECTION",
      "EMAIL_REPLY_SUGGESTION",
      "PO_EXTRACTION",
      "PO_CLASSIFICATION",
      "DEAL_INSIGHTS",
      "DEAL_RISK_SCORING",
      "DEAL_SUMMARY",
      "CUSTOMER_INSIGHTS",
      "LEAD_SCORING",
      "AUTOMATION_AI_CLASSIFICATION",
      "AUTOMATION_AI_EXTRACTION",
    ],
    inputCostPer1kTokens: 0.0025,
    outputCostPer1kTokens: 0.01,
    status: "active",
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai",
    displayName: "GPT-4.1 Mini",
    capabilities: ["PO_EXTRACTION", "PO_SUMMARIZATION", "SALES_FORECAST", "AUTOMATION_AI_DECISION"],
    inputCostPer1kTokens: 0.0004,
    outputCostPer1kTokens: 0.0016,
    status: "active",
  },
];

function capability(
  id: string,
  name: string,
  description: string,
  category: string,
  modelId = "gpt-4o-mini",
  confidenceThreshold = 0.8,
  requiresApproval = false,
  approvalPolicy: AIApprovalPolicy = "below_threshold"
): AICapabilityDefinition {
  const model = AI_MODEL_REGISTRY.find((m) => m.id === modelId) ?? AI_MODEL_REGISTRY[0];
  return {
    id,
    name,
    description,
    category,
    enabled: true,
    modelId,
    confidenceThreshold,
    requiresApproval,
    approvalPolicy,
    supportedProviders: ["openai"],
    supportedModels: model.capabilities.includes(id) ? [modelId] : AI_MODEL_REGISTRY.filter((m) => m.capabilities.includes(id)).map((m) => m.id),
    metadata: { mockMode: true },
  };
}

export const DEFAULT_AI_CAPABILITIES: AICapabilityDefinition[] = [
  capability("EMAIL_CLASSIFICATION", "Email Classification", "Classify incoming email intent and category", "Email"),
  capability("EMAIL_SUMMARIZATION", "Email Summarization", "Generate concise email summaries", "Email"),
  capability("EMAIL_INTENT_DETECTION", "Email Intent Detection", "Detect sales intent from email content", "Email", "gpt-4o", 0.82),
  capability("EMAIL_REPLY_SUGGESTION", "Email Reply Suggestion", "Suggest email replies for review", "Email", "gpt-4o", 0.85, true, "below_threshold"),
  capability("PO_EXTRACTION", "PO Extraction", "Extract structured PO fields from documents", "Purchase Orders", "gpt-4o", 0.9, true),
  capability("PO_CLASSIFICATION", "PO Classification", "Classify purchase order documents", "Purchase Orders", "gpt-4o", 0.85),
  capability("PO_SUMMARIZATION", "PO Summarization", "Summarize PO content", "Purchase Orders", "gpt-4.1-mini", 0.8),
  capability("DEAL_INSIGHTS", "Deal Insights", "Generate deal insights and recommendations", "Deals", "gpt-4o", 0.8),
  capability("DEAL_RISK_SCORING", "Deal Risk Scoring", "Score deal risk based on activity signals", "Deals", "gpt-4o", 0.85),
  capability("DEAL_SUMMARY", "Deal Summary", "Summarize deal context for sales teams", "Deals"),
  capability("SALES_FORECAST", "Sales Forecast", "Forecast sales outcomes from pipeline data", "Sales", "gpt-4.1-mini", 0.75),
  capability("CUSTOMER_INSIGHTS", "Customer Insights", "Generate customer relationship insights", "Customers", "gpt-4o", 0.8),
  capability("CUSTOMER_SUMMARY", "Customer Summary", "Summarize customer profile and history", "Customers"),
  capability("CUSTOMER_INTENT", "Customer Intent", "Identify customer buying intent signals", "Customers", "gpt-4o", 0.82),
  capability("FOLLOWUP_SUGGESTION", "Follow-up Suggestion", "Suggest follow-up actions and timing", "Follow-ups", "gpt-4o-mini", 0.78),
  capability("LEAD_SCORING", "Lead Scoring", "Score lead quality and priority", "Sales", "gpt-4o", 0.85),
  capability("AUTOMATION_AI_CLASSIFICATION", "Automation AI Classification", "AI classification step for automation workflows", "Automation", "gpt-4o", 0.8),
  capability("AUTOMATION_AI_DECISION", "Automation AI Decision", "AI decision support for automation branches", "Automation", "gpt-4.1-mini", 0.85, true),
  capability("AUTOMATION_AI_EXTRACTION", "Automation AI Extraction", "Extract structured data in automation flows", "Automation", "gpt-4o", 0.9, true),
];

export function createDefaultAIConfiguration(updatedBy = "user-1"): AIConfiguration {
  const now = new Date().toISOString();
  return {
    id: "ai-config-1",
    enabled: true,
    provider: "openai",
    providerStatus: "not_connected",
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2048,
    defaultConfidenceThreshold: 0.8,
    requireApprovalBelowThreshold: true,
    approvalPolicy: "below_threshold",
    dataProcessingMode: "redacted",
    allowEmailAI: true,
    allowPOAI: true,
    allowDealAI: true,
    allowCustomerAI: true,
    allowAutomationAI: true,
    redactSensitiveData: true,
    allowProviderRetention: false,
    createdAt: now,
    updatedAt: now,
    updatedBy,
    metadata: { mockMode: true, credentialNote: "Configured on backend when production is enabled" },
  };
}

export function normalizeAIConfiguration(input: Partial<AIConfiguration> & { id: string }): AIConfiguration {
  const defaults = createDefaultAIConfiguration(input.updatedBy ?? "user-1");
  return {
    ...defaults,
    ...input,
    id: input.id,
    metadata: { mockMode: true, ...(defaults.metadata ?? {}), ...(input.metadata ?? {}) },
  };
}

export function normalizeAICapability(input: AICapabilityDefinition): AICapabilityDefinition {
  const fallback = DEFAULT_AI_CAPABILITIES.find((c) => c.id === input.id);
  return {
    ...(fallback ?? input),
    ...input,
    supportedProviders: input.supportedProviders ?? fallback?.supportedProviders ?? ["openai"],
    supportedModels: input.supportedModels ?? fallback?.supportedModels ?? [input.modelId],
    metadata: { mockMode: true, ...(input.metadata ?? {}) },
  };
}

export function normalizeAIExecution(
  input: Partial<AIExecutionRecord> & { id: string; capability: string }
): AIExecutionRecord {
  const now = new Date().toISOString();
  return {
    id: input.id,
    capability: input.capability,
    provider: input.provider ?? "openai",
    model: input.model ?? "gpt-4o-mini",
    status: input.status ?? "queued",
    sourceType: input.sourceType ?? "system",
    sourceId: input.sourceId ?? "mock",
    requestedAt: input.requestedAt ?? now,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    totalTokens: input.totalTokens ?? (input.inputTokens ?? 0) + (input.outputTokens ?? 0),
    estimatedCost: input.estimatedCost ?? 0,
    currency: input.currency ?? "USD",
    confidence: input.confidence,
    requiresApproval: input.requiresApproval ?? false,
    approvalStatus: input.approvalStatus,
    errorMessage: input.errorMessage,
    resultSummary: input.resultSummary,
    automationExecutionId: input.automationExecutionId,
    metadata: { mockMode: true, ...(input.metadata ?? {}) },
  };
}

export function getModelById(modelId: string) {
  return AI_MODEL_REGISTRY.find((m) => m.id === modelId);
}

export function getCapabilityById(capabilityId: string, capabilities: AICapabilityDefinition[]) {
  return capabilities.find((c) => c.id === capabilityId);
}

export function estimateTokenCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) return 0;
  return (inputTokens / 1000) * model.inputCostPer1kTokens + (outputTokens / 1000) * model.outputCostPer1kTokens;
}

function periodStart(period: AIUsagePeriod): Date | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function buildAIUsageSummary(
  executions: AIExecutionRecord[],
  filters: AIUsageFilters = {}
): AIUsageSummary {
  const period = filters.period ?? "30d";
  const start = periodStart(period);
  let filtered = executions;
  if (start) {
    filtered = filtered.filter((e) => new Date(e.requestedAt) >= start);
  }
  if (filters.capability) filtered = filtered.filter((e) => e.capability === filters.capability);
  if (filters.provider) filtered = filtered.filter((e) => e.provider === filters.provider);
  if (filters.model) filtered = filtered.filter((e) => e.model === filters.model);
  if (filters.sourceType) filtered = filtered.filter((e) => e.sourceType === filters.sourceType);

  const successful = filtered.filter((e) => e.status === "succeeded");
  const failed = filtered.filter((e) => e.status === "failed");
  const waiting = filtered.filter((e) => e.status === "waiting_approval");
  const withConfidence = filtered.filter((e) => typeof e.confidence === "number");
  const withLatency = filtered.filter((e) => typeof e.durationMs === "number");

  const byCapabilityMap = new Map<string, { count: number; tokens: number; cost: number }>();
  const byModelMap = new Map<string, { count: number; tokens: number; cost: number }>();
  const byProviderMap = new Map<AIProviderId, { count: number; tokens: number; cost: number }>();

  for (const exec of filtered) {
    const cap = byCapabilityMap.get(exec.capability) ?? { count: 0, tokens: 0, cost: 0 };
    cap.count += 1;
    cap.tokens += exec.totalTokens;
    cap.cost += exec.estimatedCost;
    byCapabilityMap.set(exec.capability, cap);

    const model = byModelMap.get(exec.model) ?? { count: 0, tokens: 0, cost: 0 };
    model.count += 1;
    model.tokens += exec.totalTokens;
    model.cost += exec.estimatedCost;
    byModelMap.set(exec.model, model);

    const prov = byProviderMap.get(exec.provider) ?? { count: 0, tokens: 0, cost: 0 };
    prov.count += 1;
    prov.tokens += exec.totalTokens;
    prov.cost += exec.estimatedCost;
    byProviderMap.set(exec.provider, prov);
  }

  const totalTokens = filtered.reduce((sum, e) => sum + e.totalTokens, 0);

  return {
    period,
    totalExecutions: filtered.length,
    successfulExecutions: successful.length,
    failedExecutions: failed.length,
    waitingApproval: waiting.length,
    totalTokens,
    inputTokens: filtered.reduce((sum, e) => sum + e.inputTokens, 0),
    outputTokens: filtered.reduce((sum, e) => sum + e.outputTokens, 0),
    estimatedCost: filtered.reduce((sum, e) => sum + e.estimatedCost, 0),
    currency: "USD",
    averageLatencyMs:
      withLatency.length > 0
        ? Math.round(withLatency.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / withLatency.length)
        : 0,
    averageConfidence:
      withConfidence.length > 0
        ? withConfidence.reduce((sum, e) => sum + (e.confidence ?? 0), 0) / withConfidence.length
        : null,
    successRate: filtered.length > 0 ? Math.round((successful.length / filtered.length) * 100) : null,
    byCapability: Array.from(byCapabilityMap.entries()).map(([capability, data]) => ({
      capability,
      ...data,
    })),
    byModel: Array.from(byModelMap.entries()).map(([model, data]) => ({ model, ...data })),
    byProvider: Array.from(byProviderMap.entries()).map(([provider, data]) => ({ provider, ...data })),
    mockMode: true,
  };
}

export function buildAIStatusSummary(
  config: AIConfiguration,
  capabilities: AICapabilityDefinition[],
  executions: AIExecutionRecord[]
): AIStatusSummary {
  const usage = buildAIUsageSummary(executions, { period: "30d" });
  const provider = AI_PROVIDERS.find((p) => p.id === config.provider);
  return {
    enabled: config.enabled,
    provider: config.provider,
    providerStatus: config.providerStatus,
    providerLabel: provider?.label ?? config.provider,
    enabledCapabilities: capabilities.filter((c) => c.enabled).length,
    totalCapabilities: capabilities.length,
    totalExecutions: usage.totalExecutions,
    successRate: usage.successRate,
    mockMode: true,
    backendConnectionRequired: config.providerStatus === "not_connected",
  };
}

export function getCapabilityLabel(capabilityId: string, capabilities: AICapabilityDefinition[]) {
  return getCapabilityById(capabilityId, capabilities)?.name ?? capabilityId;
}

const MOCK_RESULTS: Record<string, { summary: string; confidence: number }> = {
  EMAIL_CLASSIFICATION: { summary: "Mock classification: Quotation Request (mock)", confidence: 0.92 },
  EMAIL_SUMMARIZATION: { summary: "Mock summary: Customer requested revised pricing (mock)", confidence: 0.88 },
  EMAIL_INTENT_DETECTION: { summary: "Mock intent: purchase interest detected (mock)", confidence: 0.86 },
  EMAIL_REPLY_SUGGESTION: { summary: "Mock reply draft generated for review (mock)", confidence: 0.74 },
  PO_EXTRACTION: { summary: "Mock PO fields extracted — awaiting approval (mock)", confidence: 0.63 },
  PO_CLASSIFICATION: { summary: "Mock PO document classified as standard order (mock)", confidence: 0.9 },
  PO_SUMMARIZATION: { summary: "Mock PO summary generated (mock)", confidence: 0.87 },
  DEAL_INSIGHTS: { summary: "Mock deal insight: stagnation risk detected (mock)", confidence: 0.81 },
  DEAL_RISK_SCORING: { summary: "Mock risk score: medium (mock)", confidence: 0.84 },
  DEAL_SUMMARY: { summary: "Mock deal summary generated (mock)", confidence: 0.89 },
  SALES_FORECAST: { summary: "Mock forecast: pipeline weighted at 72% (mock)", confidence: 0.77 },
  CUSTOMER_INSIGHTS: { summary: "Mock customer insight: expansion opportunity (mock)", confidence: 0.83 },
  CUSTOMER_SUMMARY: { summary: "Mock customer summary generated (mock)", confidence: 0.9 },
  CUSTOMER_INTENT: { summary: "Mock intent: renewal likely (mock)", confidence: 0.8 },
  FOLLOWUP_SUGGESTION: { summary: "Mock follow-up: send pricing update in 2 days (mock)", confidence: 0.86 },
  LEAD_SCORING: { summary: "Mock lead score: 78/100 (mock)", confidence: 0.85 },
  AUTOMATION_AI_CLASSIFICATION: { summary: "Mock automation classification complete (mock)", confidence: 0.91 },
  AUTOMATION_AI_DECISION: { summary: "Mock automation decision — approval required (mock)", confidence: 0.68 },
  AUTOMATION_AI_EXTRACTION: { summary: "Mock automation extraction complete (mock)", confidence: 0.72 },
};

export function buildMockAIResult(capabilityId: string, overrides?: { confidence?: number; failed?: boolean }) {
  const base = MOCK_RESULTS[capabilityId] ?? {
    summary: `Mock AI result for ${capabilityId}`,
    confidence: 0.8,
  };
  return {
    summary: base.summary,
    confidence: overrides?.confidence ?? base.confidence,
    failed: overrides?.failed ?? false,
  };
}

export const seedAIExecutions: AIExecutionRecord[] = [
  normalizeAIExecution({
    id: "ai-exec-1",
    capability: "EMAIL_CLASSIFICATION",
    provider: "openai",
    model: "gpt-4o-mini",
    status: "succeeded",
    sourceType: "email",
    sourceId: "email-1",
    requestedAt: "2026-09-01T05:12:00Z",
    startedAt: "2026-09-01T05:12:01Z",
    completedAt: "2026-09-01T05:12:02Z",
    durationMs: 980,
    inputTokens: 420,
    outputTokens: 85,
    totalTokens: 505,
    estimatedCost: estimateTokenCost("gpt-4o-mini", 420, 85),
    confidence: 0.92,
    requiresApproval: false,
    resultSummary: MOCK_RESULTS.EMAIL_CLASSIFICATION.summary,
  }),
  normalizeAIExecution({
    id: "ai-exec-2",
    capability: "PO_EXTRACTION",
    provider: "openai",
    model: "gpt-4o",
    status: "waiting_approval",
    sourceType: "purchase_order",
    sourceId: "po-1",
    requestedAt: "2026-08-29T11:02:00Z",
    startedAt: "2026-08-29T11:02:01Z",
    durationMs: 2100,
    inputTokens: 1800,
    outputTokens: 320,
    totalTokens: 2120,
    estimatedCost: estimateTokenCost("gpt-4o", 1800, 320),
    confidence: 0.63,
    requiresApproval: true,
    approvalStatus: "pending",
    automationExecutionId: "exec-2",
    resultSummary: MOCK_RESULTS.PO_EXTRACTION.summary,
  }),
  normalizeAIExecution({
    id: "ai-exec-3",
    capability: "AUTOMATION_AI_CLASSIFICATION",
    provider: "openai",
    model: "gpt-4o",
    status: "failed",
    sourceType: "automation",
    sourceId: "exec-3",
    requestedAt: "2026-08-28T14:21:00Z",
    startedAt: "2026-08-28T14:21:01Z",
    completedAt: "2026-08-28T14:21:02Z",
    durationMs: 1100,
    inputTokens: 650,
    outputTokens: 0,
    totalTokens: 650,
    estimatedCost: estimateTokenCost("gpt-4o", 650, 0),
    errorMessage: "Mock provider unavailable — backend connection required",
    resultSummary: "AI execution failed (mock)",
    automationExecutionId: "exec-3",
  }),
  normalizeAIExecution({
    id: "ai-exec-4",
    capability: "DEAL_INSIGHTS",
    provider: "openai",
    model: "gpt-4o",
    status: "succeeded",
    sourceType: "deal",
    sourceId: "deal-1",
    requestedAt: "2026-08-27T09:15:00Z",
    startedAt: "2026-08-27T09:15:01Z",
    completedAt: "2026-08-27T09:15:03Z",
    durationMs: 1650,
    inputTokens: 920,
    outputTokens: 180,
    totalTokens: 1100,
    estimatedCost: estimateTokenCost("gpt-4o", 920, 180),
    confidence: 0.81,
    requiresApproval: false,
    resultSummary: MOCK_RESULTS.DEAL_INSIGHTS.summary,
  }),
];

export function createAIExecutionFromRun(params: {
  capability: AICapabilityDefinition;
  config: AIConfiguration;
  input: RunCapabilityInput;
  result: ReturnType<typeof buildMockAIResult>;
}): AIExecutionRecord {
  const now = new Date().toISOString();
  const inputTokens = 400 + Math.floor(Math.random() * 400);
  const outputTokens = 60 + Math.floor(Math.random() * 120);
  const model = getModelById(params.capability.modelId) ?? getModelById(params.config.defaultModel)!;
  const needsApproval =
    params.capability.requiresApproval ||
    params.capability.approvalPolicy === "always" ||
    (params.capability.approvalPolicy === "below_threshold" &&
      params.result.confidence < params.capability.confidenceThreshold);

  let status: AIExecutionStatus = "succeeded";
  if (params.result.failed) status = "failed";
  else if (needsApproval) status = "waiting_approval";

  return normalizeAIExecution({
    id: generateId("ai-exec"),
    capability: params.capability.id,
    provider: params.config.provider,
    model: params.capability.modelId,
    status,
    sourceType: params.input.sourceType,
    sourceId: params.input.sourceId,
    requestedAt: now,
    startedAt: now,
    completedAt: status === "waiting_approval" ? undefined : now,
    durationMs: 900 + Math.floor(Math.random() * 800),
    inputTokens,
    outputTokens: params.result.failed ? 0 : outputTokens,
    totalTokens: params.result.failed ? inputTokens : inputTokens + outputTokens,
    estimatedCost: estimateTokenCost(params.capability.modelId, inputTokens, params.result.failed ? 0 : outputTokens),
    confidence: params.result.confidence,
    requiresApproval: needsApproval,
    approvalStatus: needsApproval ? "pending" : undefined,
    errorMessage: params.result.failed ? "Mock AI execution failure" : undefined,
    resultSummary: params.result.summary,
    automationExecutionId: params.input.automationExecutionId,
    metadata: { mockResult: true },
  });
}
