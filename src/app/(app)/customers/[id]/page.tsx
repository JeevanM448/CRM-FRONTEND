"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { Edit, Handshake, Mail, MapPin, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    getCustomer,
    getCustomerAccessStatus,
    getContactsByCustomer,
    getDealsByCustomer,
    getPOsByCustomer,
    getEmails,
    getActivities,
    getFollowUps,
  } = useCRMStore();
  const { canEdit } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const access = getCustomerAccessStatus(id);
  if (access === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This customer is outside your team scope. This is a frontend navigation check only, not production authorization."
        actionLabel="Back to Customers"
        onAction={() => {
          window.location.href = "/customers";
        }}
      />
    );
  }

  const customer = getCustomer(id);
  if (!customer) notFound();

  const contacts = getContactsByCustomer(id);
  const deals = getDealsByCustomer(id);
  const pos = getPOsByCustomer(id);
  const emails = getEmails().filter((e) => e.customerId === id);
  const activities = getActivities({ customerId: id });
  const followUps = getFollowUps().filter((f) => f.customerId === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {customer.location}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setDealOpen(true)}>
              <Handshake className="h-4 w-4" />
              New Deal
            </Button>
            <Button variant="accent" onClick={() => setEmailOpen(true)}>
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={formatCurrency(customer.revenue)} />
        <KpiCard label="Active Deals" value={String(customer.activeDeals)} />
        <KpiCard label="Open POs" value={String(pos.filter((p) => p.status !== "completed").length)} />
        <KpiCard label="Last Activity" value={formatDate(customer.lastActivity)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Primary Contact</p>
                <p className="font-medium">{customer.contactName}</p>
                <p className="text-sm text-muted-foreground">{customer.contactEmail}</p>
                <p className="text-sm text-muted-foreground">{customer.contactPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Owner</p>
                <p className="font-medium">{customer.owner}</p>
                <p className="text-sm text-muted-foreground">Industry: {customer.industry}</p>
                <div className="mt-2"><StatusBadge status={customer.status} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.designation}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Expected Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/deals/${d.id}`} className="font-medium hover:underline">{d.title}</Link>
                    </TableCell>
                    <TableCell>{formatCurrency(d.value)}</TableCell>
                    <TableCell><StatusBadge status={d.stage} type="stage" /></TableCell>
                    <TableCell>{formatDate(d.expectedClose)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <div className="space-y-3">
            {emails.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No emails linked yet.</Card>
            ) : (
              emails.map((email) => (
                <Card key={email.id} className="p-4">
                  <Link href="/inbox" className="font-medium hover:underline">{email.subject}</Link>
                  <p className="text-sm text-muted-foreground">{email.preview}</p>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium hover:underline">{po.poNumber}</Link>
                    </TableCell>
                    <TableCell>{formatCurrency(po.amount)}</TableCell>
                    <TableCell><StatusBadge status={po.status} type="po" /></TableCell>
                    <TableCell>{formatDate(po.deliveryDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups">
          <div className="space-y-3">
            {followUps.map((fu) => (
              <Card key={fu.id} className="p-4">
                <p className="font-medium">{fu.title}</p>
                <p className="text-sm text-muted-foreground">Due: {formatDate(fu.dueDate)}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <ActivityTimeline activities={activities} />
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
      <DealFormDialog open={dealOpen} onOpenChange={setDealOpen} defaultCustomerId={id} />
      <ComposeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} defaultCustomerId={id} defaultTo={customer.contactEmail} />
    </div>
  );
}
