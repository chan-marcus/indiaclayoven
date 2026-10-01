import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/site/PageHeader";
import { getSiteText } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your India Clay Oven order for pickup or delivery.",
};

export default async function CheckoutPage() {
  const t = await getSiteText();
  return (
    <>
      <PageHeader
        k="checkout.header"
        eyebrow={t["checkout.header.eyebrow"]}
        title={t["checkout.header.title"]}
        intro={t["checkout.header.intro"]}
      />
      <CheckoutForm />
    </>
  );
}
