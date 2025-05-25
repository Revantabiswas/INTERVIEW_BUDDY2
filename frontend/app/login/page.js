"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { signInWithEmail, getBrowserSupabaseClient } from "@/lib/utils/supabase-browser"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
    // Prefetch dashboard route for faster navigation
  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])
  
  // Animation to reveal content after page load - optimized for speed
  useEffect(() => {
    // Show content immediately for faster user experience
    setShowContent(true)
  }, [])
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await signInWithEmail(email, password)
      
      if (error) {
        throw error
      }
      
      // Check if login was successful by verifying the session
      if (data?.user) {
        // Show success message
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        })
        
        // Use router.replace for client-side navigation first
        router.replace("/dashboard")
        
        // Fallback with window.location after a short delay if router doesn't work
        setTimeout(() => {
          if (window.location.pathname !== "/dashboard") {
            window.location.href = "/dashboard"
          }
        }, 500)
      }
      
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  // Function to handle login with OAuth providers - optimized redirect
  const handleOAuthLogin = async (provider) => {
    setIsLoading(true)
    
    try {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`
        }
      })
      
      if (error) {
        throw error
      }
      
      // The user will be redirected to the OAuth provider and then to dashboard
    } catch (error) {
      console.error(`${provider} login error:`, error)
      toast({
        title: "Login failed",
        description: error.message || `Could not sign in with ${provider}.`,
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left side - Image with enhanced content */}
      <motion.div
        className="hidden md:block md:w-1/2 relative bg-gray-900"
        initial={{ x: "-100%" }}
        animate={{ x: showContent ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <Image
          src="/login.jpg"
          alt="Study workspace"
          fill
          style={{ objectFit: "cover" }}
          priority
          className="opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white mb-6">
              Ace Your Technical Interviews
            </h1>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Transform the way you prepare with personalized AI-powered practice sessions, curated study paths, and real-time feedback.
            </p>
            
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path>
                  </svg>
                </div>
                <span className="text-white/90">Track your progress over time</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <span className="text-white/90">Access curated study materials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span className="text-white/90">Practice with AI mock interviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login Form with Interview Buddy logo */}
      <motion.div
        className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background"
        initial={{ x: "100%" }}
        animate={{ x: showContent ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">IB</span>
                </div>
                <div className="absolute -inset-1 rounded-full bg-primary/20 -z-10 animate-pulse-slow blur-md"></div>
              </div>
              <h1 className="text-3xl font-bold mt-2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-transparent bg-clip-text">Interview</span>
                <span className="text-foreground ml-1">Buddy AI</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Your AI-powered interview preparation companion</p>
            </div>
            
            <Card className="border-muted/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Sign in to continue your interview preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-input/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-input/60"
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all" 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </div>
                    ) : "Sign In"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"></path>
                    </svg>
                    GitHub
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleOAuthLogin('facebook')}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    Facebook
                  </Button>
                </div>
                
                <p className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

