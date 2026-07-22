import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    template: "%s | CeVo",
    default: "CeVo - Secure Election Portal",
  },
  description:
    "Official secure and anonymous voting portal.",
  keywords: ["CeVo", "election", "voting", "portal"],
  robots: "index, follow",
};

import { Toaster } from 'react-hot-toast';
import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NextTopLoader color="#ff7f50" showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
