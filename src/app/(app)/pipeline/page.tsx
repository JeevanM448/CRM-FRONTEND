"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DealCard } from "@/components/pipeline/deal-card";
import { SearchBar } from "@/components/ui/search-bar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DealStage } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";

export default function PipelinePage() {
  const {
    getDeals,
    getCustomers,
    getTeamDealOwners,
    getTeamPipelineSummary,
    updateDealStage,
    getPipelineStageConfigs,
    getPipelineStageLabels,
  } = useCRMStore();
  const allDeals = getDeals();
  const customers = getCustomers();
  const { role } = usePermissions();
  const isManager = role === "sales_manager";
  const teamOwners = isManager ? getTeamDealOwners() : [];
  const pipelineSummary = isManager ? getTeamPipelineSummary() : null;
  const stageLabels = getPipelineStageLabels();
  const columns = useMemo(() => {
    const configs = [...getPipelineStageConfigs()].sort((a, b) => a.order - b.order);
    return configs
      .filter(
        (stage) => stage.status === "active" || allDeals.some((deal) => deal.stage === stage.id)
      )
      .map((stage) => stage.id);
  }, [getPipelineStageConfigs, allDeals]);

  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [minValue, setMinValue] = useState("all");

  const owners = [...new Set(allDeals.map((d) => d.owner))];

  const deals = useMemo(() => {
    return allDeals.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesOwner = isManager
        ? ownerId === "all" || d.ownerId === ownerId
        : owner === "all" || d.owner === owner;
      const matchesCustomer = customer === "all" || d.customerId === customer;
      const matchesValue =
        minValue === "all" ||
        (minValue === "10l" && d.value >= 1000000) ||
        (minValue === "25l" && d.value >= 2500000);
      return matchesSearch && matchesOwner && matchesCustomer && matchesValue;
    });
  }, [allDeals, search, owner, ownerId, customer, minValue, isManager]);

  function handleDragStart(e: React.DragEvent, dealId: string) {
    e.dataTransfer.setData("dealId", dealId);
  }

  function handleDrop(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === stage) return;
    const config = getPipelineStageConfigs().find((item) => item.id === stage);
    if (config?.status !== "active") {
      toast.error("This pipeline stage is inactive");
      return;
    }
    updateDealStage(dealId, stage);
    toast.success(`Deal moved to ${stageLabels[stage]}`);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === "salesperson" ? "My Pipeline" : isManager ? "Team Pipeline" : "Sales Pipeline"}
        description={
          isManager
            ? "Drag team deals between stages to update pipeline status."
            : "Drag deals between stages to update pipeline status."
        }
      />

      {isManager && pipelineSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Pipeline Value" value={formatCurrency(pipelineSummary.totalPipelineValue)} featured />
          <KpiCard label="Active Deals" value={String(pipelineSummary.activeDeals)} />
          <KpiCard label="Total Deals" value={String(pipelineSummary.totalDeals)} />
          <KpiCard label="Won Value" value={formatCurrency(pipelineSummary.wonValue)} />
        </div>
      ) : null}

      <Card className="flex flex-col gap-4 p-4 lg:flex-row">
        <SearchBar placeholder="Search pipeline..." value={search} onChange={setSearch} className="flex-1" />
        <div className="flex flex-wrap gap-2">
          <Select value={isManager ? ownerId : owner} onValueChange={isManager ? setOwnerId : setOwner}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {isManager
                ? teamOwners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)
                : owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={customer} onValueChange={setCustomer}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Customer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minValue} onValueChange={setMinValue}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Value" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Values</SelectItem>
              <SelectItem value="10l">≥ ₹10L</SelectItem>
              <SelectItem value="25l">≥ ₹25L</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage}
              className="flex w-[300px] shrink-0 flex-col"
              onDrop={(e) => handleDrop(e, stage)}
              onDragOver={handleDragOver}
            >
              <div className="mb-3 rounded-xl bg-muted/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">{stageLabels[stage]}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium">{stageDeals.length}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(totalValue)} value</p>
              </div>
              <div className={cn("flex min-h-[400px] flex-col gap-3 rounded-2xl border-2 border-dashed border-transparent p-1 hover:border-border")}>
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} />
                ))}
                {stageDeals.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
