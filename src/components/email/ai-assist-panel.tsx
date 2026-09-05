"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EmailThread } from "@/types";
import { toast } from "sonner";
import {
  classifyEmail,
  generateReply,
  summarizeEmail,
} from "@/services/mock/aiService";
import { emailService } from "@/services";
import { useCRMStore } from "@/store/CRMStoreProvider";

interface AIAssistPanelProps {
  email?: EmailThread;
}

export function AIAssistPanel({ email }: AIAssistPanelProps) {
  const { getSettings, getCurrentUser } = useCRMStore();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const aiEnabled = getSettings().aiEnabled;
  const user = getCurrentUser();

  if (!email) {
    return (
      <Card className="h-full border-purple-100">
        <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Select an email to view AI assistance
        </CardContent>
      </Card>
    );
  }

  if (!aiEnabled) {
    return (
      <Card className="h-full border-dashed">
        <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          AI assistance is disabled in Settings
        </CardContent>
      </Card>
    );
  }

  const classification = classifyEmail(email);
  const summary = email.aiSummary ?? summarizeEmail(email);

  function handleGenerate() {
    if (!email) return;
    const draft = generateReply(
      {
        from: email.from,
        subject: email.subject,
        messages: email.messages,
        aiIntent: classification.intent,
      },
      user?.name ?? "Sales Team"
    );
    setReply(draft);
    toast.success("Reply draft generated — review before sending");
  }

  async function handleSend() {
    if (!email || !reply.trim()) {
      if (!reply.trim()) toast.error("Generate or write a reply first");
      return;
    }
    setSending(true);
    try {
      const subject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
      await emailService.sendEmail({
        to: email.fromEmail || email.from,
        subject,
        body: reply,
        customerId: email.customerId ?? "",
        dealId: email.dealId ?? "",
      });
      toast.success("Email sent successfully");
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="h-full border-purple-100 bg-gradient-to-b from-purple-50/50 to-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ai">
          <Sparkles className="h-4 w-4" />
          ✦ AI Assist
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Summary</p>
            <p>{summary}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Intent</p>
            <p className="font-medium">{classification.intent}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Priority</p>
            <StatusBadge status={classification.priority} type="priority" />
          </div>
          <div>
            <p className="text-muted-foreground">Suggested Action</p>
            <p>{classification.suggestedAction}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested Reply</p>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Click Generate Reply to create a draft..."
            className="min-h-[140px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="ai" size="sm" onClick={handleGenerate}>Generate Reply</Button>
            <Button variant="outline" size="sm" onClick={handleGenerate}>Regenerate</Button>
            <SubmitButton type="button" variant="default" size="sm" loading={sending} loadingText="Sending..." onClick={handleSend}>
              Send
            </SubmitButton>
          </div>
          <p className="text-xs text-muted-foreground">AI never sends automatically. Review and send manually.</p>
        </div>
      </CardContent>
    </Card>
  );
}
