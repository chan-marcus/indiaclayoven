import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { RestaurantDataProvider } from "@/lib/restaurant-data";
import { restaurant, fullAddress } from "@/lib/data/restaurant";

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

export const metadata: Metadata = {
  title: {
    default: `${restaurant.name} — ${restaurant.tagline} | Clement Street, San Francisco`,
    template: `%s | ${restaurant.name}`,
  },
  description:
    "Charcoal-fired clay oven cooking, hand-rolled breads and slow-simmered curries on Clement Street in San Francisco's Richmond District. Order online for pickup or delivery.",
  openGraph: {
    title: `${restaurant.name} — ${restaurant.tagline}`,
    description: `${restaurant.cuisine}. ${fullAddress}.`,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <RestaurantDataProvider>
          <CartProvider>{children}</CartProvider>
        </RestaurantDataProvider>
      </body>
    </html>
  );
}
