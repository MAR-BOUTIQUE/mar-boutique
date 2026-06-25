import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mar Boutique — Mujeres que visten con intención",
    template: "%s | Mar Boutique",
  },
  description:
    "Ropa femenina con estilo playero y costero desde Cartagena, Colombia. Prendas versátiles, atemporales y auténticas.",
  keywords: ["ropa femenina", "boutique Cartagena", "moda playera", "vestidos Colombia", "ropa mujer"],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Mar Boutique",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
