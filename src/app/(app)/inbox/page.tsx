import { Suspense } from "react";
import InboxPageContent from "./page-content";

export default function InboxRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading inbox...</div>}>
      <InboxPageContent />
    </Suspense>
  );
}
