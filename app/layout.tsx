import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import ErrorToastContainer from "@/components/shared/ErrorToast";

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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://buildargus.dev'),
  title: 'Argus — Clone any website with AI',
  description: 'Enter any URL. Argus scrapes it, extracts the design system, and rebuilds it in seconds. Winner of the Google × Cerebral Valley Hackathon. Powered by Claude, Gemini, and Kimi.',
  authors: [{ name: 'Sammy Tourani', url: 'https://twitter.com/sammytourani' }],
  alternates: {
    canonical: 'https://buildargus.dev',
  },
  openGraph: {
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds. Winner of Google × Cerebral Valley Hackathon.',
    url: 'https://buildargus.dev',
    siteName: 'Argus',
    images: [{ url: 'https://buildargus.dev/argus-assets/og-image.png', width: 1200, height: 630, alt: 'Argus — Clone any website with AI' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Argus — Clone any website with AI',
    description: 'Enter any URL and watch Argus clone it in seconds.',
    images: ['https://buildargus.dev/argus-assets/og-image.png'],
    creator: '@sammytourani',
  },
  keywords: ['AI website cloner', 'website builder', 'AI tools', 'web scraping', 'Argus', 'clone website', 'website cloning'],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/argus-assets/official_eye.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              if (localStorage.getItem('argus-dark-mode') === 'true') {
                document.documentElement.setAttribute('data-argus-dark', 'true');
              }
            } catch(e) {}
          })()
        `}} />
      </head>
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} ${jetbrainsMono.variable} font-sans`}>
        <ToastProvider>
          {children}
          <ErrorToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
