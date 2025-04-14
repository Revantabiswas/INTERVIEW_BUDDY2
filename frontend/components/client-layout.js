"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import UserAvatar from "@/components/user-avatar"

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login" || pathname === "/register"
  
  if (isLoginPage) {
    return (
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    )
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="fixed top-4 right-4 z-50">
          <UserAvatar />
        </div>
        {children}
      </main>
    </div>
  )
}
