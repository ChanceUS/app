import type React from "react"
import type { Metadata } from "next"
import { Poppins, Open_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import ClientInit from "./client-init"

// Fonts
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ChanceUS - Skill-Based Gaming Platform",
  description: "The ultimate skill-based gaming platform where your talents turn into tokens",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${openSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`
          :root {
            --font-sans: ${poppins.style.fontFamily}, ui-sans-serif, system-ui, sans-serif;
            --font-mono: ${jetbrainsMono.style.fontFamily}, ui-monospace, SFMono-Regular, monospace;
          }
        `}</style>
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ClientInit /> {/* ensures window.supabase is set */}
        {children}
      </body>
    </html>
  )
}