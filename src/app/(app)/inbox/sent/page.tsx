import { redirect } from "next/navigation";

export default function InboxSentPage() {
  redirect("/inbox?folder=sent");
}
