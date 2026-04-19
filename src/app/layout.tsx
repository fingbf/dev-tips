import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.SITE_URL || "https://dev-tips-fingbfs-projects.vercel.app";

export const metadata: Metadata = {
  title: "Dev Tips",
  description: "開発Tips・スニペット集",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "Dev Tips",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();`,
          }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
            <Link
              href="/"
              className="rounded-md px-2 py-1.5 text-lg font-bold tracking-tight transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:hover:bg-zinc-800"
            >
              Dev Tips
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Tips
              </Link>
              <Link
                href="/tools"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                ツール
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-4xl px-4 py-6 text-center text-sm text-zinc-500">
            Dev Tips
          </div>
        </footer>
      </body>
    </html>
  );
}
