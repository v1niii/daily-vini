import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily Vini – Valorant Tracker",
  description:
    "Look up players, view leaderboards, check server status, and save agent picks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-5 sm:py-10">
            {children}
          </main>
          <footer className="mt-auto px-4 py-6 text-center text-[11px] text-muted-foreground sm:py-8">
            daily vini is not affiliated with riot games.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
