import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { ToastContainer } from "@/components/ui/Toast/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JOCKSPORT | Official Athletic Footwear & Sportswear",
    template: "%s | JOCKSPORT",
  },
  description:
    "Leading authentic sports retail destination - 100% genuine athletic footwear, apparel and equipment from Nike, Adidas, Puma, Under Armour, Asics and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ReactQueryProvider>
          <Header />
          {children}
          <Footer />
          <ToastContainer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
