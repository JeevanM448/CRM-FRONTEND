import type { EmailThread } from "@/types";

export interface AIClassification {
  intent: string;
  priority: "low" | "medium" | "high";
  summary: string;
  suggestedAction: string;
}

const RULES: { keywords: string[]; intent: string; priority: "low" | "medium" | "high"; action: string }[] = [
  {
    keywords: ["quotation", "quote", "pricing", "revised"],
    intent: "Quotation Request",
    priority: "high",
    action: "Send revised quotation",
  },
  {
    keywords: ["po", "purchase order", "order confirmation"],
    intent: "PO Update",
    priority: "medium",
    action: "Follow up on PO status",
  },
  {
    keywords: ["specification", "technical", "document", "attached"],
    intent: "Document Review",
    priority: "medium",
    action: "Review specs and respond",
  },
  {
    keywords: ["urgent", "asap", "immediately"],
    intent: "Urgent Request",
    priority: "high",
    action: "Respond within 24 hours",
  },
  {
    keywords: ["meeting", "call", "schedule", "demo"],
    intent: "Meeting Request",
    priority: "medium",
    action: "Schedule a call",
  },
];

function matchRule(text: string) {
  const lower = text.toLowerCase();
  return RULES.find((rule) => rule.keywords.some((k) => lower.includes(k)));
}

export function classifyEmail(email: Pick<EmailThread, "subject" | "preview" | "messages">): AIClassification {
  const text = `${email.subject} ${email.preview} ${email.messages?.[0]?.body ?? ""}`;
  const rule = matchRule(text);
  if (rule) {
    return {
      intent: rule.intent,
      priority: rule.priority,
      summary: `Customer message relates to: ${rule.intent.toLowerCase()}.`,
      suggestedAction: rule.action,
    };
  }
  return {
    intent: "General Inquiry",
    priority: "low",
    summary: "Standard customer communication requiring review.",
    suggestedAction: "Review and respond appropriately",
  };
}

export function summarizeEmail(email: Pick<EmailThread, "subject" | "preview" | "messages">): string {
  const body = email.messages?.[0]?.body ?? email.preview;
  const firstSentence = body.split(/[.!\n]/)[0]?.trim();
  return firstSentence ? `${firstSentence}.` : email.preview;
}

export function generateReply(
  email: Pick<EmailThread, "from" | "subject" | "messages" | "aiIntent">,
  senderName = "Sales Team"
): string {
  const firstName = email.from.split(" ")[0] ?? "Customer";
  const intent = email.aiIntent ?? "General Inquiry";

  if (intent === "Quotation Request") {
    return `Dear ${firstName},\n\nThank you for your email regarding the revised quotation. Please find attached our updated proposal with the delivery timelines and pricing we discussed.\n\nPlease let us know if you need any further adjustments.\n\nBest regards,\n${senderName}\nShiny Stone Sales OS`;
  }
  if (intent === "PO Update") {
    return `Dear ${firstName},\n\nThank you for the update on the purchase order. We have noted the details and will confirm receipt shortly.\n\nBest regards,\n${senderName}\nShiny Stone Sales OS`;
  }
  if (intent === "Meeting Request") {
    return `Dear ${firstName},\n\nThank you for reaching out. I would be happy to schedule a call at your convenience. Please share your preferred date and time.\n\nBest regards,\n${senderName}\nShiny Stone Sales OS`;
  }
  return `Dear ${firstName},\n\nThank you for your email regarding "${email.subject}". We have reviewed your message and will respond with the requested information shortly.\n\nBest regards,\n${senderName}\nShiny Stone Sales OS`;
}

export function recommendFollowUp(
  email: Pick<EmailThread, "subject" | "preview" | "messages">
): { title: string; priority: "low" | "medium" | "high" } {
  const classification = classifyEmail(email);
  return {
    title: `${classification.suggestedAction} — ${email.subject.slice(0, 40)}`,
    priority: classification.priority,
  };
}

export function extractPOFields(input: {
  poNumber?: string;
  customerName?: string;
  amount?: number;
  deliveryDate?: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
}) {
  const amount = input.amount ?? 0;
  const tax = Math.round(amount * 0.18);
  return {
    poNumber: input.poNumber ?? `PO-${Math.floor(10000 + Math.random() * 90000)}`,
    customer: input.customerName ?? "",
    amount,
    deliveryDate: input.deliveryDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    items: input.items ?? [
      { name: "Line Item A", quantity: 100, unitPrice: Math.round(amount / 100) },
      { name: "Line Item B", quantity: 50, unitPrice: Math.round(amount / 50) },
    ],
    tax,
    total: amount + tax,
    confidence: 96,
  };
}

export function getDealInsight(deal: {
  probability: number;
  lastActivity: string;
  stage: string;
  attentionReason?: string;
}) {
  const daysSince = Math.floor(
    (Date.now() - new Date(deal.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );
  const risk =
    deal.attentionReason ??
    (daysSince >= 5 ? `Customer hasn't responded for ${daysSince} days` : "No significant risks detected");
  const action =
    daysSince >= 5
      ? "Send follow-up email"
      : deal.stage === "quotation"
        ? "Confirm quotation receipt"
        : "Continue nurturing the opportunity";
  return { probability: deal.probability, risk, recommendedAction: action };
}
