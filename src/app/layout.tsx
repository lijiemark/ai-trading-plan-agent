import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TraderPalProvider } from "@/components/TraderPalProvider";
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
  title: "TraderPal",
  description:
    "AI trading accountability companion — plan with intention, trade with discipline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TraderPalProvider>{children}</TraderPalProvider>
      </body>
    </html>
  );
}
