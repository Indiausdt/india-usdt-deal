import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndiaUSDTdeal P2P Mini App",
  description: "Fast, safe and trusted USDT P2P trading in India.",
  icons: {
    icon: "/brand.png",
    shortcut: "/brand.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
