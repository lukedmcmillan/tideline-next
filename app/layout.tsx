import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tideline: Ocean Intelligence",
  description: "The brief. The trackers. The edge.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
