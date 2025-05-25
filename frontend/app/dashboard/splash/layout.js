"use client"

import { ThemeProvider } from "@/components/theme-provider"

export default function SplashLayout({ children }) {
  return (
    <div>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </div>
  )
}