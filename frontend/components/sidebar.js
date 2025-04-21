"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Code,
  FileUp,
  MessageSquare,
  BookOpen,
  FlaskConical,
  Network,
  Map,
  FileCode,
  BarChart2,
  Settings,
  Home,
  Menu,
  X,
  BookMarked,
  Layers,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "DSA Practice", href: "/dsa-practice", icon: Code },
  { name: "Document Upload", href: "/document-upload", icon: FileUp },
  { name: "AI Chat", href: "/ai-chat", icon: MessageSquare },
  { name: "Study Notes", href: "/study-notes", icon: BookOpen },
  { name: "Flashcards", href: "/flashcards", icon: BookMarked },
  // { name: "Mind Maps", href: "/mind-maps", icon: Network },
  { name: "Study Roadmap", href: "/study-roadmap", icon: Map },
  { name: "Practice Tests", href: "/practice-tests", icon: FlaskConical },
  { name: "Splash Screen", href: "/splash", icon: Layers },
  // { name: "Code Debugging", href: "/code-debugging", icon: FileCode },
  // { name: "Progress Tracking", href: "/progress", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Close sidebar when route changes on mobile
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {isMobile && (
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}

      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "w-64 border-r"
        } bg-background`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center space-x-2">
              <Layers className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">InterviewBuddy AI</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

