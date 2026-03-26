"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The separate client dashboard is considered redundant.
 * Users are redirected to the Project Management page which serves
 * as the primary interaction hub when connected.
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projets");
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kelen-green-500 border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground italic">
          Redirection vers vos projets...
        </p>
      </div>
    </div>
  );
}
