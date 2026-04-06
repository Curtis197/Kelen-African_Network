import type { Metadata } from "next";
import { ProProjectForm } from "@/components/pro/ProProjectForm";

export const metadata: Metadata = {
  title: "Nouveau projet — Kelen Pro",
};

export default function NewProProjectPage() {
  return <ProProjectForm />;
}
