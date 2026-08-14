import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your India Clay Oven order for pickup or delivery.",
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Almost there"
        intro="Tell us where to send it and when you would like it."
      />
      <CheckoutForm />
    </>
  );
}
