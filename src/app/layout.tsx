import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-rounded", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "10MG Credit",
  description: "White-label lending infrastructure for financial institutions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${fraunces.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
