"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { Calendar, Edit, Mail, Clock, Trash2, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, stageLabels } from "@/components/ui/status-badge";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { AIInsight } from "@/components/ui/ai-insight";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { FollowUpFormDialog } from "@/components/email/compose-email-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { dealService } from "@/services";
import { getDealInsight } from "@/services/mock/aiService";
import type { DealStage } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getDeal,
    getDealAccessStatus,
    getPOsByDeal,
    getFollowUpsByDeal,
    getActivities,
    getEmails,
    getSettings,
  } = useCRMStore();
  const { canEdit, canDeleteDeals } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const access = getDealAccessStatus(id);
  if (access === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This deal is outside your team scope. This is a frontend navigation check only, not production authorization."
        actionLabel="Back to Deals"
        onAction={() => router.push("/deals")}
      />
    );
  }

  const deal = getDeal(id);
  if (!deal) notFound();

  const pos = getPOsByDeal(id);
  const followUps = getFollowUpsByDeal(id);
  const activities = getActivities({ dealId: id });
  const emails = getEmails().filter((e) => e.dealId === id);
  const aiEnabled = getSettings().aiEnabled;
  const insight = getDealInsight(deal);

  async function handleStageChange(stage: DealStage) {
    await dealService.updateDealStage(id, stage);
    toast.success(`Deal moved to ${stageLabels[stage]}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{deal.customerName}</p>
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold">{formatCurrency(deal.value)}</span>
            <StatusBadge status={deal.stage} type="stage" />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Expected close: {formatDate(deal.expectedClose)}
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setEmailOpen(true)}>
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button variant="outline" onClick={() => setFollowUpOpen(true)}>
              <Clock className="h-4 w-4" />
              Add Follow-up
            </Button>
            <Select value={deal.stage} onValueChange={(v) => handleStageChange(v as DealStage)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Move stage" /></SelectTrigger>
              <SelectContent>
                {(["new", "qualified", "quotation", "negotiation", "won", "lost"] as DealStage[]).map((s) => (
                  <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canDeleteDeals ? (
              <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Deal Value" value={formatCurrency(deal.value)} />
        <KpiCard label="Stage" value={stageLabels[deal.stage]} />
        <KpiCard label="Probability" value={`${deal.probability}%`} />
        <KpiCard label="Owner" value={deal.owner} />
        <KpiCard label="Expected Close" value={formatDate(deal.expectedClose)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
              <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  {deal.emailCount} emails · {deal.poStatus ?? "No PO"} · {deal.followUpStatus ?? "No follow-up"}
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card className="p-6"><ActivityTimeline activities={activities} /></Card>
            </TabsContent>
            <TabsContent value="emails">
              <div className="space-y-3">
                {emails.length === 0 ? (
                  <Card className="p-6 text-muted-foreground">No emails linked.</Card>
                ) : (
                  emails.map((e) => (
                    <Card key={e.id} className="p-4">
                      <Link href="/inbox" className="font-medium hover:underline">{e.subject}</Link>
                      <p className="text-sm text-muted-foreground">{e.preview}</p>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="pos">
              <Card>
                {pos.length === 0 ? (
                  <CardContent className="p-6 text-muted-foreground">No purchase orders yet.</CardContent>
                ) : (
                  pos.map((po) => (
                    <CardContent key={po.id} className="flex items-center justify-between border-b p-4 last:border-0">
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium hover:underline">{po.poNumber}</Link>
                      <div className="flex items-center gap-3">
                        <span>{formatCurrency(po.amount)}</span>
                        <StatusBadge status={po.status} type="po" />
                      </div>
                    </CardContent>
                  ))
                )}
              </Card>
            </TabsContent>
            <TabsContent value="follow-ups">
              <div className="space-y-3">
                {followUps.map((fu) => (
                  <Card key={fu.id} className="p-4">
                    <p className="font-medium">{fu.title}</p>
                    <p className="text-sm text-muted-foreground">Due: {formatDate(fu.dueDate)} · {fu.status}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {aiEnabled ? (
          <AIInsight
            probability={insight.probability}
            risk={insight.risk}
            recommendedAction={insight.recommendedAction}
            onGenerate={() => setFollowUpOpen(true)}
            generateLabel="Create Follow-up"
          />
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">AI assistance is disabled in Settings.</Card>
        )}
      </div>

      <DealFormDialog open={editOpen} onOpenChange={setEditOpen} deal={deal} />
      <ComposeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} defaultCustomerId={deal.customerId} defaultDealId={deal.id} />
      <FollowUpFormDialog open={followUpOpen} onOpenChange={setFollowUpOpen} defaultCustomerId={deal.customerId} defaultDealId={deal.id} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete deal?"
        description="This deal will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          await dealService.deleteDeal(id);
          toast.success("Deal deleted successfully");
          router.push("/deals");
        }}
      />
    </div>
  );
}
