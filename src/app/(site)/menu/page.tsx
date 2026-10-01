import { Suspense } from "react";
import type { Metadata } from "next";
import { MenuBrowser, DietaryNote } from "@/components/menu/MenuBrowser";
import { PageHeader } from "@/components/site/PageHeader";
import { getSiteText } from "@/lib/db";

export const metadata: Metadata = {
  title: "Menu & Order Online",
  description:
    "Browse the full India Clay Oven menu: tandoori specialties, curries, biryanis and clay oven breads. Order online for pickup or delivery.",
};

export default async function MenuPage() {
  const t = await getSiteText();
  return (
    <>
      <PageHeader
        eyebrow={t["menu.header.eyebrow"]}
        title={t["menu.header.title"]}
        intro={t["menu.header.intro"]}
      />
      <DietaryNote />
      <Suspense fallback={<div className="container-page py-20 text-ink-500">Loading menu…</div>}>
        <MenuBrowser />
      </Suspense>
    </>
  );
}
