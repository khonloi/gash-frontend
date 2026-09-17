import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { ToastContainer } from "@/components/ui/Toast/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com';

export const viewport: Viewport = {
  themeColor: '#0C1C30',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JOCKSPORT | Official Athletic Footwear & Sportswear",
    template: "%s | JOCKSPORT",
  },
  description:
    "Leading authentic sports retail destination - 100% genuine athletic footwear, apparel and equipment from Nike, Adidas, Puma, Under Armour, Asics and more.",
  keywords: [
    "sportswear",
    "running shoes",
    "athletic footwear",
    "gym gear",
    "football boots",
    "Nike",
    "Adidas",
    "Puma",
    "Asics",
  ],
  authors: [{ name: "JOCKSPORT" }],
  creator: "JOCKSPORT",
  publisher: "JOCKSPORT",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "JOCKSPORT",
    title: "JOCKSPORT | Official Athletic Footwear & Sportswear",
    description:
      "Leading authentic sports retail destination - 100% genuine athletic footwear, apparel and equipment from Nike, Adidas, Puma, Under Armour, Asics and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JOCKSPORT | Official Athletic Footwear & Sportswear",
    description:
      "Leading authentic sports retail destination - 100% genuine athletic footwear, apparel and equipment.",
    creator: "@jocksport",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "JOCKSPORT",
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
        sameAs: [
          "https://facebook.com/jocksport",
          "https://instagram.com/jocksport",
          "https://twitter.com/jocksport"
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: "+1-800-555-JOCK",
          areaServed: "US",
          availableLanguage: ["English"]
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "JOCKSPORT",
        publisher: {
          "@id": `${siteUrl}/#organization`
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/collections/all?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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

