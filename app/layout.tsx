import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: 'Argus — Clone any website with AI',
  description: 'Enter any URL. Argus scrapes it, extracts the design system, and rebuilds it in a sandboxed environment. Powered by Claude Opus 4.6, Gemini 2.5 Pro, and Kimi K2.',
  openGraph: {
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds.',
    url: 'https://argus.build',
    siteName: 'Argus',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds.',
    images: ['/og-image.png'],
    creator: '@sammytourani',
  },
  keywords: ['AI website cloner', 'website builder', 'AI tools', 'web scraping', 'Argus'],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
