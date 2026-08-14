import type { Metadata } from "next";
import { Confirmation } from "@/components/checkout/Confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
};

export default function ConfirmationPage() {
  return <Confirmation />;
}
