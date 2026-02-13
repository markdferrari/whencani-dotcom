import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { ToastProvider } from "@whencani/ui";
import "leaflet/dist/leaflet.css";
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
  metadataBase: new URL("https://whencaniwatchit.com"),
  title: {
    default: "WhenCanIWatchIt",
    template: "%s | WhenCanIWatchIt",
  },
  description:
    "Track new and upcoming movie releases with TMDB data. Browse by genre, see what's trending, and save your favourite films.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "WhenCanIWatchIt",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ToastProvider>
          <Header />
          {children}
          <footer className="border-t border-zinc-200/70 bg-white/80 py-6 dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <a href="https://www.whencaniplayit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Gaming? Visit WhenCanIPlayIt.com →
                </a>
              </div>
              <div>
                <a href="https://www.whencanireadit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Books? Visit WhenCanIReadIt.com &rarr;
                </a>
              </div>              
              <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                Data provided by <a href="https://www.tmdb.org" target="_blank" rel="noopener noreferrer" className="underline">TMDB.org</a>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
