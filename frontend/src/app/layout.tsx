import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import ClientInitializer from "@/components/providers/ClientInitializer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Southzone | Premium Streetwear & Fashion",
  description:
    "Discover premium streetwear, hoodies, shirts, and traditional fashion at SouthZone. Elevate your style with curated collections for the youth.",
  keywords: "streetwear, fashion, hoodies, shirts, clothing, SouthZone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClientInitializer>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#141414',
                color: '#ededed',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientInitializer>
      </body>
    </html>
  );
}