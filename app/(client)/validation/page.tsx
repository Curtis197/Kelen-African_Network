import type { Metadata } from "next";
import { ClientValidationPage } from "@/components/client/ClientValidationPage";

export const metadata: Metadata = {
  title: "Validation — Kelen",
};

export default function Page() {
  return <ClientValidationPage />;
}
