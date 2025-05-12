"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getBrowserSupabaseClient } from "@/lib/utils/supabase-browser"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Animation to reveal content after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getBrowserSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        throw error
      }
      
      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link.",
      })
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Reset failed",
        description: error.message || "There was a problem sending the password reset email. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">IB</span>
              </div>
              <div className="absolute -inset-1 rounded-full bg-primary/20 -z-10 animate-pulse-slow blur-md"></div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-2">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-transparent bg-clip-text">Interview</span>
            <span className="text-foreground ml-1">Buddy AI</span>
          </h1>
        </div>
        
        <Card className="border-muted/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              {!isSubmitted ? "Enter your email address to receive a password reset link" : "Password reset email sent"}
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
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
                        <span>Sending link...</span>
                      </div>
                    ) : "Send Reset Link"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="text-center py-6">
              <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-md dark:bg-green-900/30 dark:text-green-300">
                A password reset link has been sent to <span className="font-medium">{email}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Check your email inbox and follow the instructions to reset your password. If you don't see the email, please check your spam folder.
              </p>
            </CardContent>
          )}
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full text-center">
              <Link href="/auth-layout/login" className="text-primary hover:underline font-medium text-sm">
                Return to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}