"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import UserAvatar from "@/components/user-avatar"

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const isFullScreenPage = pathname === "/" || 
                           pathname === "/login" || 
                           pathname === "/signup" || 
                           pathname === "/register" || 
                           pathname === "/splash" ||
                           pathname.startsWith("/auth-layout")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Check localStorage on client-side to sync sidebar state
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState !== null) {
      setIsSidebarCollapsed(savedCollapsedState === 'true')
    }
    
    // Set up event listener for sidebar collapse/expand
    const handleStorageChange = () => {
      const updatedState = localStorage.getItem('sidebarCollapsed')
      if (updatedState !== null) {
        setIsSidebarCollapsed(updatedState === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for direct communication
    const handleSidebarToggle = (e) => {
      setIsSidebarCollapsed(e.detail.isCollapsed)
    }
    
    window.addEventListener('sidebarToggle', handleSidebarToggle)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarToggle', handleSidebarToggle)
    }
  }, [])
  
  if (isFullScreenPage) {
    return (
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    )
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-[70px]" : "ml-64"}`}>
        <div className="fixed top-4 right-4 z-50">
          <UserAvatar />
        </div>
        <div className="px-4 py-4">
          {children}
        </div>
      </main>
    </div>
  )
}
