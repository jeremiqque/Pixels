import type { Metadata } from "next"
import { Geist } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pixels",
  description:
    "Browser-based image dithering tool. Upload an image, choose an algorithm, tweak the parameters, and download the result.",
  keywords: [
    "dither",
    "dithering",
    "floyd-steinberg",
    "atkinson",
    "ordered dithering",
    "bayer matrix",
    "stucki",
    "burkes",
    "sierra",
    "pixel art",
    "image processing",
  ],
  authors: [{ name: "David Umoru", url: "https://twitter.com/theumoru" }],
  creator: "David Umoru",
  openGraph: {
    type: "website",
    title: "Pixels",
    description:
      "Browser-based image dithering tool. Upload an image, choose an algorithm, tweak the parameters, and download the result.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixels",
    description:
      "Browser-based image dithering tool. Upload an image, choose an algorithm, tweak the parameters, and download the result.",
    creator: "@theumoru",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const ppNeueCorp = localFont({
  src: "../public/fonts/PPNeueCorp-NormalMedium-BF6732c5c5212e9.otf",
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        ppNeueCorp.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
