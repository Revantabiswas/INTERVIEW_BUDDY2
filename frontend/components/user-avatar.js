"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Bell, Moon, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export default function UserAvatar() {
  const { user, loading, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  // Extract user details from Supabase auth user
  useEffect(() => {
    if (user) {
      // Get name from various sources with fallbacks
      const getName = () => {
        return (
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'User'
        )
      }

      // Get avatar from various sources
      const getAvatar = () => {
        return (
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          user.user_metadata?.photo ||
          null
        )
      }

      setUserProfile({
        name: getName(),
        email: user.email,
        image: getAvatar(),
        role: user.user_metadata?.role || 'Free Plan',
      })
    } else {
      setUserProfile(null)
    }
  }, [user])

  // Show loading state
  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/10 transition-all hover:border-primary/30">
            <AvatarImage 
              src={userProfile?.image || "/placeholder.svg?height=40&width=40"} 
              alt={userProfile?.name || 'User'} 
            />            <AvatarFallback className="bg-primary/5 text-primary">
              {userProfile?.name
                ? userProfile.name
                    .split(" ")
                    .map((n) => n[0]?.toUpperCase())
                    .join("")
                    .slice(0, 2)
                : 'U'}
            </AvatarFallback>
          </Avatar>
          {user && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex w-full cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full cursor-pointer items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="flex w-full cursor-pointer items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Welcome</p>
                <p className="text-xs leading-none text-muted-foreground">Sign in to access all features</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth-layout/login" className="flex w-full cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Log in</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth-layout/signup" className="flex w-full cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Sign up</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

