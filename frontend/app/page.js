"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, FileUp, MessageSquare, BookOpen, Network, Calendar, FileCode, ChevronRight, Star, Zap } from "lucide-react";
import Background from "./background";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Code snippets that will appear to be flying across the screen
  const codeSnippets = [
    "function quickSort(arr) { /* ... */ }",
    "class TreeNode { constructor(val) { this.val = val; this.left = null; this.right = null; } }",
    "const binarySearch = (arr, target) => { /* ... */ }",
    "function dijkstra(graph, start) { /* ... */ }",
    "async function fetchData() { const response = await fetch('/api'); }",
    "useEffect(() => { /* ... */ }, [dependencies]);",
    "const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);",
    "function mergeSort(arr) { if (arr.length <= 1) return arr; }",
    "#include <iostream>",
    "public static void main(String[] args) { /* ... */ }",
    "def depth_first_search(graph, node): # ...",
    "SELECT * FROM users WHERE role = 'interviewer'",
  ];

  useEffect(() => {
    setMounted(true);
    
    // Rotate through features every 5 seconds
    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Code,
      title: "DSA Practice Questions",
      description: "Master algorithms and data structures with our curated collection of 500+ practice problems organized by difficulty, topic, and company. Get AI-assisted hints and step-by-step solutions.",
      href: "/dsa-practice",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: FileUp,
      title: "Document Upload",
      description: "Upload study materials in PDF, DOCX, or TXT format for AI processing. Our system analyzes your content to create flashcards, practice questions, and custom study guides.",
      href: "/document-upload",
      color: "from-purple-500 to-pink-400",
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Chat",
      description: "Get instant answers to your technical questions with our specialized AI assistant. Discuss algorithms, system design, and receive code reviews with detailed explanations.",
      href: "/ai-chat",
      color: "from-green-500 to-emerald-400",
    },
    {
      icon: BookOpen,
      title: "Study Notes Generator",
      description: "Transform lengthy documents into concise, well-structured study notes. Customize the format, highlight key concepts, and generate practice questions from your notes.",
      href: "/study-notes",
      color: "from-yellow-500 to-amber-400",
    },
    {
      icon: Network,
      title: "Mind Map Generator",
      description: "Visualize complex concepts and their relationships in interactive mind maps. Export as images or PDFs, collaborate with peers, and expand your understanding through visual learning.",
      href: "/mind-maps",
      color: "from-red-500 to-orange-400",
    },
    {
      icon: Calendar,
      title: "Study Roadmap",
      description: "Get a personalized study plan based on your goals, timeline, and assessment results. Track your progress, receive reminders, and adjust your plan as you improve.",
      href: "/study-roadmap",
      color: "from-indigo-500 to-violet-400",
    },
    {
      icon: FileCode,
      title: "Code Debugging",
      description: "Get AI-powered feedback and debugging tips for your code. Upload snippets, explain your intent, and receive optimization suggestions and best practices.",
      href: "/code-debugging",
      color: "from-sky-500 to-blue-400",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Flying code elements that appear across the page */}
      {mounted && (
        <>
          {codeSnippets.map((snippet, index) => (
            <motion.div
              key={index}
              className="fixed pointer-events-none font-mono text-sm whitespace-nowrap text-primary/40 dark:text-primary/50 filter blur-[0.3px]"
              initial={{
                x: index % 2 === 0 ? -200 : window.innerWidth + 200,
                y: (Math.random() * window.innerHeight),
                opacity: 0,
              }}
              animate={{
                x: index % 2 === 0 ? window.innerWidth + 200 : -200,
                y: (Math.random() * window.innerHeight),
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                ease: "linear",
                delay: Math.random() * 10,
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              {snippet}
            </motion.div>
          ))}
        </>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Hero Section with 3D elements */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          {/* Gradient background with animated glow */}
          {/* <Background /> */}

          {/* 3D Floating Elements with enhanced animations */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-gradient-to-br from-blue-500/10 to-primary/10 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* 3D Geometric Shapes with more dynamic animations */}
          <motion.div 
            className="absolute top-20 left-[10%] w-20 h-20 rounded-lg border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.1)] transform-gpu"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-[10%] w-24 h-24 rounded-full border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.1)] transform-gpu"
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute top-1/3 right-[20%] w-16 h-16 rounded-md border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.1)] transform-gpu"
            animate={{
              rotate: [45, 0, 45],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">
                Ace Your Technical Interviews with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-red-500">
                  InterviewBuddy AI
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Your AI-powered companion for interview preparation, coding challenges, and technical exams. Get personalized study plans, practice with real interview questions, and receive instant feedback.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
                asChild
              >
                <Link href="/dsa-practice" className="text-base gap-2">
                  Start Practicing Now <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="shadow-md hover:shadow-lg transition-all border-primary/20 hover:border-primary/40"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>
            
            {/* Key stats */}
            <motion.div 
              className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Practice Problems</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI Assistance</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary">97%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced 3D Code Blocks with animations */}
          <motion.div 
            className="hidden lg:block absolute -left-20 top-1/3 w-80 h-48 bg-card/70 backdrop-blur-sm border border-border rounded-lg perspective-3d transform-3d shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(59,130,246,0.2)] transition-all duration-500"
            initial={{ x: -200, rotate: -12, opacity: 0 }}
            animate={{ x: 0, rotate: -12, opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            whileHover={{ x: 20, y: -5, transition: { duration: 0.3 } }}
            style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1), 0 5px 20px -5px rgba(0,0,0,0.05)" }}
          >
            <div className="p-5 font-mono text-sm">
              <div className="flex space-x-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-primary">function</div>
              <div className="pl-2">
                <span className="text-primary">binarySearch</span>
                <span>(arr, target) {`{`}</span>
              </div>
              <div className="pl-4">let left = 0;</div>
              <div className="pl-4">let right = arr.length - 1;</div>
              <div className="pl-4">while (left &lt;= right) {'{'}</div>
              <div className="pl-6 text-muted-foreground">// Implementation</div>
              <div className="pl-4">{`}`}</div>
              <div className="pl-2">{`}`}</div>
            </div>
          </motion.div>

          <motion.div 
            className="hidden lg:block absolute -right-20 top-2/3 w-80 h-48 bg-card/70 backdrop-blur-sm border border-border rounded-lg perspective-3d transform-3d shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(59,130,246,0.2)] transition-all duration-500"
            initial={{ x: 200, rotate: 12, opacity: 0 }}
            animate={{ x: 0, rotate: 12, opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            whileHover={{ x: -20, y: -5, transition: { duration: 0.3 } }}
            style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1), 0 5px 20px -5px rgba(0,0,0,0.05)" }}
          >
            <div className="p-5 font-mono text-sm">
              <div className="flex space-x-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-primary">class</div>
              <div className="pl-2">
                <span className="text-primary">TreeNode</span>
                <span> {`{`}</span>
              </div>
              <div className="pl-4">constructor(val) {`{`}</div>
              <div className="pl-6">this.val = val;</div>
              <div className="pl-6">this.left = null;</div>
              <div className="pl-6">this.right = null;</div>
              <div className="pl-4">{`}`}</div>
              <div className="pl-2">{`}`}</div>
            </div>
          </motion.div>
        </section>

        {/* Improved Features Showcase Section with dynamic cards */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background -z-10"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative inline-block">
              Key Features
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to prepare for your next technical interview, all in one platform.
            </p>
          </motion.div>

          {/* Highlighted feature with larger card */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              <Card className="overflow-hidden border-primary/20 shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-8 flex flex-col justify-center">
                    <div className="bg-primary/10 w-14 h-14 flex items-center justify-center rounded-full mb-4">
                      {React.createElement(features[activeFeatureIndex].icon, { className: "h-7 w-7 text-primary" })}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{features[activeFeatureIndex].title}</h3>
                    <p className="text-muted-foreground mb-6">{features[activeFeatureIndex].description}</p>
                    <Button asChild>
                      <Link href={features[activeFeatureIndex].href} className="gap-2">
                        Explore Feature <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className={`bg-gradient-to-br ${features[activeFeatureIndex].color} p-8 text-white flex items-center justify-center`}>
                    <div className="flex items-center justify-center w-full h-full backdrop-blur-sm bg-black/20 rounded-lg">
                      {React.createElement(features[activeFeatureIndex].icon, { className: "h-24 w-24" })}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Card 
                  className="h-full border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  onMouseEnter={() => setActiveFeatureIndex(index)}
                >
                  <CardHeader className="pb-4">
                    <div className={`bg-gradient-to-r ${feature.color} w-12 h-12 rounded-full flex items-center justify-center mb-3`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="flex items-center">
                      {feature.title}
                      {index === activeFeatureIndex && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2"
                        >
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        </motion.div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm h-20 overflow-hidden text-ellipsis">
                      {feature.description.substring(0, 120)}...
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full group">
                      <Link href={feature.href} className="flex items-center justify-between">
                        <span>Explore</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Enhanced CTA Section with testimonials */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 -z-10 rounded-3xl"></div>
          
          {/* Flying particles in the background */}
          {mounted && [...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/20"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 500,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 500,
                scale: [Math.random() * 0.5 + 0.5, Math.random() * 1 + 0.8, Math.random() * 0.5 + 0.5],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                filter: "blur(1px)",
              }}
            />
          ))}
          
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-10"
            >
              <div className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium mb-4">
                <Zap className="inline-block w-4 h-4 mr-1" /> Get Started Today
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Boost Your Interview Preparation?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                Join thousands of students and professionals who have improved their technical interview skills with
                InterviewBuddy AI. Our platform provides everything you need to succeed.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border border-border/50">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"InterviewBuddy AI helped me prepare for my Google interview. The DSA practice and mind maps were game changers!"</p>
                  <div className="font-medium">Alex K.</div>
                  <div className="text-sm text-muted-foreground">Software Engineer at Google</div>
                </div>
                <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border border-border/50">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"The personalized study roadmap kept me on track, and the AI chat answered all my questions. Highly recommended!"</p>
                  <div className="font-medium">Maya R.</div>
                  <div className="text-sm text-muted-foreground">Frontend Developer at Microsoft</div>
                </div>
                <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border border-border/50">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"I uploaded my study materials and the AI generated amazing flashcards and practice questions. Passed my interview with flying colors!"</p>
                  <div className="font-medium">James T.</div>
                  <div className="text-sm text-muted-foreground">Senior Developer at Amazon</div>
                </div>
              </div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="shadow-xl hover:shadow-2xl transition-all text-lg py-6 px-8 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/95 hover:to-violet-700" 
                  asChild
                >
                  <Link href="/login" className="gap-2">
                    Get Started Now
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

