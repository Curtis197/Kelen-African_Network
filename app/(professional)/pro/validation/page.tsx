import type { Metadata } from "next";
import { ValidationPage } from "@/components/pro/ValidationPage";

export const metadata: Metadata = {
  title: "Validation — Kelen Pro",
};

export default function Page() {
  return <ValidationPage />;
}
