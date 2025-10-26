import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Wallets Dashboard",
  description: "Manage cross-border payouts and recent activity in Ghost Wallets.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/jhz2dlr.css" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* If you’re using a PNG or SVG instead, swap it out:
            <link rel="icon" type="image/png" href="/favicon.png" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        */}
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
