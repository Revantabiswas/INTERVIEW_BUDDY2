"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/components/auth-provider"
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
  ChevronDown,
  ChevronRight,
  Files,
  Bot,
  FileText,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

// Main navigation items
const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "DSA Practice", href: "/dashboard/dsa-practice", icon: Code },
  { name: "Tests", href: "/dashboard/exam-practice", icon: Code },
  // Document workspace section is now handled separately
  { name: "Flashcards", href: "/dashboard/flashcards", icon: BookMarked },
  { name: "Study Roadmap", href: "/dashboard/study-roadmap", icon: Map },
  { name: "Practice Tests", href: "/dashboard/practice-tests", icon: FlaskConical },
  { name: "Forums", href: "/dashboard/community-forum", icon: FileCode },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

// Document workspace section with nested items
const documentItems = [
  { name: "Document Workspace", href: "/dashboard/document-workspace", icon: Files, isParent: true },
  { name: "Upload Documents", href: "/dashboard/document-workspace", icon: FileUp, isChild: true },
  { name: "AI Chat Assistant", href: "/dashboard/document-workspace", icon: Bot, isChild: true },
  { name: "Study Notes", href: "/dashboard/document-workspace", icon: BookOpen, isChild: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [documentSectionExpanded, setDocumentSectionExpanded] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Close sidebar when route changes on mobile
    if (isMobile) {
      setIsOpen(false)
    }

    // Auto-expand document section when a document-related page is active
    if (pathname.includes("document") || pathname.includes("ai-chat") || pathname.includes("study-notes")) {
      setDocumentSectionExpanded(true)
    }

    // Load collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed")
    if (savedCollapsedState !== null) {
      setIsCollapsed(savedCollapsedState === "true")
    }
  }, [pathname, isMobile])

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString())

    // Dispatch custom event for direct communication with layout
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { isCollapsed },
      })
    )
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleDocumentSection = () => {
    setDocumentSectionExpanded(!documentSectionExpanded)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if the current path matches a document section route
  const isDocumentSectionActive = documentItems.some(
    (item) => pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/")
  )

  return (
    <>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:top-5 md:left-5"
          onClick={toggleSidebar}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}

      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "fixed inset-y-0 left-0 z-40"
        } bg-background shadow-sm border-r transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[70px]" : "w-64"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`flex items-center p-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed ? (
              <>
                <Link href="/" className="flex items-center space-x-2">
                  <Layers className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">InterviewBuddy AI</span>
                </Link>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="h-8 w-8 rounded-full hover:bg-secondary ml-2"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Collapse Sidebar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <>
                <Link href="/" className="flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </Link>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="h-8 w-8 rounded-full hover:bg-secondary absolute top-4 right-1"
                      >
                        <PanelLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Expand Sidebar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>

          <div className="flex-1 overflow-auto py-2 overflow-x-hidden">
            <nav className={`space-y-1 ${isCollapsed ? "px-1" : "px-2"}`}>
              {/* Regular nav items */}
              <TooltipProvider delayDuration={300}>
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return isCollapsed ? (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-center h-10 w-10 mx-auto my-1 rounded-md transition-colors ${
                            isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
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

                {/* Document workspace section with collapsible menu */}
                <div className="pt-2">
                  {/* Parent item that toggles the section */}
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={toggleDocumentSection}
                          className={`flex items-center justify-center h-10 w-10 mx-auto my-1 rounded-md transition-colors ${
                            isDocumentSectionActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Files className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Document Workspace</TooltipContent>
                    </Tooltip>
                  ) : (
                    <button
                      onClick={toggleDocumentSection}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${
                          isDocumentSectionActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-secondary"
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <Files className="mr-3 h-5 w-5" />
                        <span>Document Workspace</span>
                      </div>
                      {documentSectionExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Child items that appear when section is expanded */}
                  {documentSectionExpanded && (
                    <div
                      className={
                        isCollapsed
                          ? "mt-1 space-y-1"
                          : "ml-4 pl-2 border-l border-border/50 mt-1 space-y-1"
                      }
                    >
                      {documentItems
                        .filter((item) => item.isChild)
                        .map((item) => {
                          const isActive = pathname === item.href
                          const Icon = item.icon

                          return isCollapsed ? (
                            <Tooltip key={item.name}>
                              <TooltipTrigger asChild>
                                <Link
                                  href={item.href}
                                  className={`flex items-center justify-center h-8 w-8 mx-auto my-1 rounded-md transition-colors ${
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "text-foreground hover:bg-secondary"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right">{item.name}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              <Icon className="mr-3 h-5 w-5" />
                              {item.name}
                            </Link>
                          )
                        })}
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </nav>
          </div>

          <div className={`border-t ${isCollapsed ? "p-2" : "p-4"} flex flex-col gap-2`}>
            {user && (
              <>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSignOut}
                          className="h-10 w-10 rounded-full hover:bg-secondary text-red-500 hover:text-red-600"
                        >
                          <LogOut className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Sign out</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="justify-start px-3 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                )}
                <div className="border-t my-1"></div>
              </>
            )}

            {isCollapsed ? (
              <ModeToggle collapsed={true} />
            ) : (
              <div className="flex items-center justify-end">
                <span className="text-sm text-muted-foreground mr-2">Theme</span>
                <ModeToggle />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add spacer div to ensure main content is pushed over to make room for sidebar */}
      {!isMobile && (
        <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "ml-[70px]" : "ml-64"}`}></div>
      )}
    </>
  )
}

