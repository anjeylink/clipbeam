import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

// For <html>: defines the font variables globals.css reads.
export const FONT_VARIABLES = `${geistSans.variable} ${geistMono.variable}`;
