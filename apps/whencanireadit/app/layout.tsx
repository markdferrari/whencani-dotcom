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

const SITE_URL = "https://whencanireadit.com";
const SITE_NAME = "WhenCanIReadIt.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WhenCanIReadIt.com - Book Release Tracker",
    template: "%s | WhenCanIReadIt.com",
  },
  description:
    "Track upcoming book releases, bestsellers, and new titles. Browse by genre, save to your bookshelf, and never miss a release.",
  keywords: [
    "book releases",
    "book release tracker",
    "upcoming books",
    "new books",
    "NYT bestsellers",
    "book release dates",
    "new fiction",
    "new non-fiction",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "WhenCanIReadIt.com",
    description:
      "Track upcoming book releases, bestsellers, and new titles. Browse by genre, save to your bookshelf, and never miss a release.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhenCanIReadIt.com",
    description:
      "Track upcoming book releases, bestsellers, and new titles. Browse by genre, save to your bookshelf, and never miss a release.",
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
          <footer className="border-t border-zinc-200/70 bg-white/80 py-6 dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <a href="https://www.whencaniwatchit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Movies? Visit WhenCanIWatchIt.com &rarr;
                </a>
              </div>
              <div>
                <a href="https://www.whencaniplayit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-700 hover:text-sky-500 dark:text-zinc-300 dark:hover:text-sky-400 transition">
                  Like Games? Visit WhenCanIPlayIt.com &rarr;
                </a>
              </div>
              <div className="sm:text-right text-sm text-zinc-500 dark:text-zinc-400">
                Data provided by <a href="https://books.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Books</a> &amp; <a href="https://developer.nytimes.com/" target="_blank" rel="noopener noreferrer" className="underline">NYT</a>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
