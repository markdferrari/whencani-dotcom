import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { ToastProvider } from "@whencani/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://whencaniplayit.com";
const SITE_NAME = "WhenCanIPlayIt.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WhenCanIPlayIt.com - Game Release Tracker",
    template: "%s | WhenCanIPlayIt.com",
  },
  description:
    "Track verified game release windows, trending review momentum, and upcoming drops across PlayStation, Xbox, Nintendo, and PC.",
  keywords: [
    "game releases",
    "game release tracker",
    "upcoming games",
    "recent releases",
    "game review momentum",
    "PlayStation releases",
    "Xbox releases",
    "Nintendo releases",
    "PC game releases",
    "board game releases",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "WhenCanIPlayIt.com",
    description:
      "Track verified game release windows, trending review momentum, and upcoming drops across PlayStation, Xbox, Nintendo, PC, and board games.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhenCanIPlayIt.com",
    description:
      "Track verified game release windows, trending review momentum, and upcoming drops across PlayStation, Xbox, Nintendo, PC, and board games.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <Header />
          {children}
          <footer className="relative border-t border-zinc-200/70 bg-white/80 py-6 dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <a href="https://www.whencaniwatchit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Movies?  Visit WhenCanIWatchIt.com →
                </a>
              </div>
              <div>
                <a href="https://www.whencanireadit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Books? Visit WhenCanIReadIt.com &rarr;
                </a>
              </div>            
              <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                Data provided by <a href="https://www.igdb.com/" target="_blank" rel="noopener noreferrer" className="underline">IGDB</a> &amp; <a href="https://boardgamegeek.com/" target="_blank" rel="noopener noreferrer" className="underline">BoardGameGeek</a>
              </div>
              
            </div>
            {/* BGG logo in bottom-right of footer (responsive) */}
            <a href="https://boardgamegeek.com/" target="_blank" rel="noopener noreferrer" className="pointer-events-auto">
              <img src="/bgg.png" alt="BoardGameGeek" className="hidden sm:block absolute right-4 bottom-3 w-20 opacity-90 dark:opacity-80 transition" />
              <img src="/bgg.png" alt="BoardGameGeek" className="block sm:hidden absolute right-3 bottom-3 w-14 opacity-90 dark:opacity-80 transition" />
            </a>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
