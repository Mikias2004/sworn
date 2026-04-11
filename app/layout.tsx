import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Sworn — Put your money where your mouth is.",
  description:
    "Set a goal. Put real money on the line. Miss it and you pay. Crush it and you owe nothing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
