import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ClientLayout from "@/components/client-layout"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "InterviewBuddy AI",
  description: "Your AI-powered interview preparation companion",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}