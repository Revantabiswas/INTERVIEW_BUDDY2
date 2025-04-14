"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Github, Twitter, Loader2, Code, Braces, Terminal, Hash } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [codeElements, setCodeElements] = useState([])
  const router = useRouter()

  // Set mounted state when component mounts on client
  useEffect(() => {
    setIsMounted(true)
    
    // Generate more varied animated elements
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 1.5 + 0.8}rem`,
      delay: `${i * 0.3}s`,
      duration: `${Math.random() * 10 + 10}s`,
      type: ['code', 'braces', 'terminal', 'hash'][i % 4]
    }));
    setCodeElements(elements);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      router.push("/")
    }, 1500)
  }

  // Early return for server rendering
  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl border bg-card p-6 shadow-xl">
            <div className="mb-6 flex flex-col items-center space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Interview Buddy AI</h1>
              <p className="text-sm text-muted-foreground">Your AI-powered interview preparation assistant</p>
            </div>
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-background to-indigo-900/20 p-4 overflow-hidden">
      {/* Animated background */}
      <div className="animated-bg"></div>
      
      {/* Floating coding elements - with more variety */}
      {codeElements.map((element) => (
        <div 
          key={element.id} 
          className="absolute text-primary/20 code-element z-0"
          style={{
            left: element.left,
            top: element.top,
            fontSize: element.size,
            animationDelay: element.delay,
            animationDuration: element.duration
          }}
        >
          {element.type === 'code' && <Code />}
          {element.type === 'braces' && <Braces />}
          {element.type === 'terminal' && <Terminal />}
          {element.type === 'hash' && <Hash />}
        </div>
      ))}
      
      <div className="w-full max-w-md z-10">
        <div 
          className="relative rounded-xl border bg-card/90 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:shadow-primary/10 hover:shadow-2xl"
        >
          {/* Background effects */}
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          {/* App logo and name with improved animations */}
          <div className="mb-6 flex flex-col items-center space-y-4 text-center">
            <div className="logo-animation">
              <div className="logo-icons">
                <Code className="logo-icon" />
                <Braces className="logo-icon" />
                <Terminal className="logo-icon" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gradient animate-gradient">Interview Buddy AI</h1>
              <p className="text-sm text-muted-foreground animate-fade-in">Your AI-powered interview preparation assistant</p>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 tab-glow">
              <TabsTrigger value="email" className="tab-trigger">Email</TabsTrigger>
              <TabsTrigger value="social" className="tab-trigger">Social Login</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 animate-slide-up">
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
                    className="transition-all duration-300 focus:shadow-md focus:border-primary input-glow"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors">
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
                    className="transition-all duration-300 focus:shadow-md focus:border-primary input-glow"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="checkbox-glow" />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me for 30 days
                  </Label>
                </div>

                <Button type="submit" className="w-full animated-button" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                  <span className="button-glow"></span>
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 animate-slide-up">
              <Button variant="outline" className="w-full social-button github-button" onClick={() => setIsLoading(true)}>
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>

              <Button variant="outline" className="w-full social-button twitter-button" onClick={() => setIsLoading(true)}>
                <Twitter className="mr-2 h-4 w-4" />
                Continue with Twitter
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm animate-fade-in" style={{animationDelay: '0.5s'}}>
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </div>

          {/* Animated elements */}
          <div className="typing-cursor"></div>
        </div>
      </div>

      <style jsx global>{`
        /* Remove 3D perspective styles */
        
        .text-gradient {
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: shine 3s linear infinite;
        }
        
        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
        
        /* More animated button styles */
        .animated-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
          background-size: 200% 100%;
          animation: gradient-shift 3s ease infinite;
          border: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .animated-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
        }
        
        .animated-button:active:not(:disabled) {
          transform: translateY(1px);
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .button-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: button-glow 2s infinite;
        }
        
        @keyframes button-glow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .input-glow {
          transition: all 0.3s ease;
        }
        
        .input-glow:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          border-color: #3b82f6;
        }
        
        .tab-glow {
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        
        .tab-trigger {
          position: relative;
          overflow: hidden;
          z-index: 1;
          transition: all 0.3s ease;
        }
        
        .tab-trigger[data-state="active"]::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          animation: tab-active 0.3s forwards;
        }
        
        @keyframes tab-active {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        .checkbox-glow:checked {
          background-color: #3b82f6;
          animation: checkbox-pulse 0.5s;
        }
        
        @keyframes checkbox-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
        }
        
        /* More animations for code elements */
        .code-element {
          opacity: 0.4;
          animation: float-around 20s linear infinite;
          filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3));
        }
        
        @keyframes float-around {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100px) translateX(100px) rotate(360deg); opacity: 0; }
        }
        
        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
          background: 
            linear-gradient(125deg, #3b82f6 0%, transparent 40%),
            linear-gradient(45deg, #8b5cf6 0%, transparent 40%),
            linear-gradient(315deg, #06b6d4 0%, transparent 40%);
          background-size: 200% 200%;
          animation: gradient-animation 15s ease infinite;
        }
        
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Logo animation */
        .logo-animation {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        
        .logo-icons {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .logo-icon {
          position: absolute;
          width: 24px;
          height: 24px;
          color: #3b82f6;
          opacity: 0;
          animation: logo-cycle 6s infinite;
        }
        
        .logo-icon:nth-child(1) { animation-delay: 0s; }
        .logo-icon:nth-child(2) { animation-delay: 2s; }
        .logo-icon:nth-child(3) { animation-delay: 4s; }
        
        @keyframes logo-cycle {
          0%, 20% { opacity: 0; transform: scale(0.8); }
          30%, 70% { opacity: 1; transform: scale(1); }
          80%, 100% { opacity: 0; transform: scale(0.8); }
        }
        
        /* Social buttons animation */
        .social-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .github-button:hover {
          background-color: #24292e;
          color: white;
          border-color: #24292e;
        }
        
        .twitter-button:hover {
          background-color: #1DA1F2;
          color: white;
          border-color: #1DA1F2;
        }
        
        /* Typing cursor effect */
        .typing-cursor {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 8px;
          height: 16px;
          background-color: #3b82f6;
          opacity: 0.7;
          animation: cursor-blink 1s step-end infinite;
        }
        
        @keyframes cursor-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.7; }
        }
        
        /* Slide up and fade in animations */
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

