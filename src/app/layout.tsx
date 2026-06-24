import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdmiroTV - Free Live TV Streaming | Watch Sports, News & Movies",
  description: "Watch over 1,000+ premium live TV channels for free. Stream live sports, breaking news, movies, and entertainment from anywhere in the world on AdmiroTV without any subscription.",
  keywords: "free live tv, watch live sports online, free iptv, online tv bangladesh, t20 live free, live news tv, free streaming portal, admirotv",
  openGraph: {
    title: "AdmiroTV - Watch Free Live TV Anywhere",
    description: "Stream 1000+ live TV channels for free. No subscription required.",
    type: "website",
    siteName: "AdmiroTV",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Adsterra Popunder */}
        <Script src="https://pl29880789.effectivecpmnetwork.com/61/32/f9/6132f99d690aa26a27d19505701f7096.js" strategy="afterInteractive" />
        {/* Adsterra SocialBar */}
        <Script src="https://pl29880791.effectivecpmnetwork.com/30/1d/9a/301d9ac3c6eece2fb2f0c23bae362bcc.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
