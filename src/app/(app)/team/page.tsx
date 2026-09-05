"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/store/CRMStoreProvider";

export default function TeamPage() {
  const user = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "admin") router.replace("/sales-team");
    else if (user?.role === "sales_manager") router.replace("/my-team");
    else router.replace("/dashboard");
  }, [user?.role, router]);

  return null;
}
