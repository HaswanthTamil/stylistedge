import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadataBase = new URL("https://stylistedge.in");

export const metadata: Metadata = {
  title: {
    default: "Stylist Edge Salon | Style That Speaks Confidence",
    template: "%s | Stylist Edge Salon",
  },
  description:
    "Experience the ultimate in feminine luxury, spa therapies, advanced facial treatments, and precision hair styling at Stylist Edge Salon, Dharmapuri. Curated by E. Ranjitha.",
  keywords: [
    "Stylist Edge",
    "salon",
    "beauty",
    "spa",
    "facials",
    "hair",
    "bridal",
    "Dharmapuri",
  ],
  authors: [{ name: "E. Ranjitha" }],
  creator: "Stylist Edge",
  themeColor: "#FDF8F6",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Stylist Edge Salon | Style That Speaks Confidence",
    description:
      "Experience premium feminine luxury, spa therapies, advanced facial treatments, and precision hair styling at Stylist Edge Salon.",
    images: ["/logo.png"],
    siteName: "Stylist Edge Salon",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stylist Edge Salon | Style That Speaks Confidence",
    description:
      "Experience premium feminine luxury, spa therapies, advanced facial treatments, and precision hair styling at Stylist Edge Salon.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Stylist Edge Salon",
    description:
      "Premium feminine luxury salon offering spa therapies, facials, bridal styling and precision hair services in Dharmapuri.",
    telephone: "+91 7810076472",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Near Anand Theater, Pidamaneri",
      addressLocality: "Dharmapuri",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    logo: "/logo.png",
  });
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDF8F6] text-[#1A1A1A]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        {children}
      </body>
    </html>
  );
}
