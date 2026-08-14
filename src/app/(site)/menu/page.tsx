import { Suspense } from "react";
import type { Metadata } from "next";
import { MenuBrowser, DietaryNote } from "@/components/menu/MenuBrowser";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "Menu & Order Online",
  description:
    "Browse the full India Clay Oven menu: tandoori specialties, curries, biryanis and clay oven breads. Order online for pickup or delivery.",
};

export default function MenuPage() {
  return (
    <>
      <PageHeader
        eyebrow="Full Menu"
        title="Menu & Order"
        intro="Everything from the clay oven, ready for pickup or delivery. Tap any dish to see it up close."
      />
      <DietaryNote />
      <Suspense fallback={<div className="container-page py-20 text-ink-500">Loading menu…</div>}>
        <MenuBrowser />
      </Suspense>
    </>
  );
}
