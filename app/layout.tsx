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
  metadataBase: new URL('https://buildargus.com'),
  title: 'Argus — Clone any website with AI',
  description: 'Enter any URL. Argus scrapes it, extracts the design system, and rebuilds it in seconds. Winner of the Google × Cerebral Valley Hackathon. Powered by Claude, Gemini, and Kimi.',
  openGraph: {
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds. Winner of Google × Cerebral Valley Hackathon.',
    url: 'https://buildargus.com',
    siteName: 'Argus',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Argus — Clone any website with AI' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds.',
    images: ['/api/og'],
    creator: '@sammytourani',
  },
  keywords: ['AI website cloner', 'website builder', 'AI tools', 'web scraping', 'Argus', 'clone website', 'website cloning'],
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
