import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVauction — Used Professional AV Gear",
  description:
    "Every Friday, serious used pro AV gear closes in one place. List your used AV gear for free.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
