import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

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
    <html lang="en">
      <body>
        <Navbar />
        <main className="container">{children}</main>
        <footer className="footer">
          <p>
            Daily Vini is not affiliated with Riot Games. Valorant is a
            trademark of Riot Games, Inc.
          </p>
          <p>
            Uses official Riot Games API: val-ranked-v1, val-content-v1,
            val-status-v1.
          </p>
        </footer>
      </body>
    </html>
  );
}
