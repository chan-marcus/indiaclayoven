import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { RestaurantDataProvider } from "@/lib/restaurant-data";
import { getCategories, getMenuItems, getRestaurant } from "@/lib/db";
import { fullAddress } from "@/lib/restaurant";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Menu, prices and restaurant details live in Supabase and the owner can
// change them at any time, so every request renders fresh data.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getRestaurant();
  return {
    title: {
      default: `${restaurant.name} | ${restaurant.tagline}, Clement Street, San Francisco`,
      template: `%s | ${restaurant.name}`,
    },
    description:
      "Charcoal-fired clay oven cooking, hand-rolled breads and slow-simmered curries on Clement Street in San Francisco's Richmond District. Order online for pickup or delivery.",
    openGraph: {
      title: `${restaurant.name} | ${restaurant.tagline}`,
      description: `${restaurant.cuisine}. ${fullAddress(restaurant)}.`,
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, items] = await Promise.all([
    getRestaurant(),
    getCategories(),
    getMenuItems(),
  ]);

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <RestaurantDataProvider initial={{ settings, categories, items }}>
          <CartProvider>{children}</CartProvider>
        </RestaurantDataProvider>
      </body>
    </html>
  );
}
