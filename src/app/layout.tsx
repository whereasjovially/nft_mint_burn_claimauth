import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NFT TEST",
  description: "NFT TEST For Mint, Burn and Claim reward",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <ToastContainer />
    </html>
  );
}
