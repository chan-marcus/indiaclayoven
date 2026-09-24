import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardDataProvider } from "@/lib/dashboard-data";
import { getOrders } from "@/lib/db";

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Manage your menu and receive online orders.",
};

/** Menu and settings come from the root layout, shared with the customer
 *  site. Orders, which hold customer contact details, load only here. */
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const orders = await getOrders();
  return (
    <DashboardDataProvider initialOrders={orders}>
      <div className="flex min-h-full flex-col bg-cream-100/50">
        <DashboardNav />
        <main className="flex-1 pb-20">{children}</main>
      </div>
    </DashboardDataProvider>
  );
}
