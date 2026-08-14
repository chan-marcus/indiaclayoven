import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Manage your menu and receive online orders.",
};

/** Data comes from <RestaurantDataProvider> in the root layout, which the
 *  customer site shares, so menu edits here show up there immediately. */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-col bg-cream-100/50">
      <DashboardNav />
      <main className="flex-1 pb-20">{children}</main>
    </div>
  );
}
