import type { Metadata } from "next";
import { ProProjectsPage } from "@/components/pro/ProProjectsPage";

export const metadata: Metadata = {
  title: "Mes projets — Kelen Pro",
};

export default function ProProjectsListPage() {
  return <ProProjectsPage />;
}
