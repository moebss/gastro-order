import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";

export const metadata: Metadata = {
  title: "Pizzeria Bella Napoli | Online bestellen (Lieferung & Abholung)",
  description:
    "Original Steinofenpizza & frische Pasta in Köln. Bestelle jetzt einfach online ohne Registrierung zur Lieferung oder Abholung.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-stone-50 font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
