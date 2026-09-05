import { redirect } from "next/navigation";

export default function InboxDraftsPage() {
  redirect("/inbox?folder=drafts");
}
