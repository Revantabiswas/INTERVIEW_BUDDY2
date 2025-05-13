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
import { signUpWithEmail, getBrowserSupabaseClient } from "@/lib/utils/supabase-browser"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Animation to reveal content after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Include the user's name in the user metadata
      const { data, error } = await signUpWithEmail(email, password, {
        full_name: fullName
      })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      })
      
      // Redirect to login page after successful signup
      router.push("/login")
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle signup with OAuth providers
  const handleOAuthSignup = async (provider) => {
    setIsLoading(true)
    
    try {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        throw error
      }
      
      // The user will be redirected to the OAuth provider
    } catch (error) {
      console.error(`${provider} signup error:`, error)
      toast({
        title: "Signup failed",
        description: error.message || `Could not sign up with ${provider}.`,
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
              Start Your Interview Prep Journey
            </h1>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Join thousands of developers who use Interview Buddy AI to prepare for technical interviews and land their dream jobs.
            </p>
            
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                  </svg>
                </div>
                <span className="text-white/90">Start preparing in minutes</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M18 8h1a4 4 0 1 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                </div>
                <span className="text-white/90">Free to get started</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>
                  </svg>
                </div>
                <span className="text-white/90">Personalized learning path</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Signup Form with Interview Buddy logo */}
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
                <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
                <CardDescription className="text-center">
                  Sign up to start your interview preparation journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="border-input/60"
                    />
                  </div>
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-input/60"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
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
                        <span>Creating account...</span>
                      </div>
                    ) : "Sign Up"}
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
                    onClick={() => handleOAuthSignup('github')}
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
                    onClick={() => handleOAuthSignup('google')}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path>
                    </svg>
                    Google
                  </Button>
                </div>
                
                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
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