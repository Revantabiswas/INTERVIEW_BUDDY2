"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Code,
  FileUp,
  MessageSquare,
  BookOpen,
  Network,
  Calendar,
  FileCode,
  ChevronRight,
  Star,
  Zap,
  Sparkles,
  Brain,
  Target,
  Users,
  Trophy,
  PlayCircle,
  Shield,
  Rocket,
  Globe,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Enhanced code snippets with more variety
  const codeSnippets = [
    "function quickSort(arr) { return arr.sort((a,b) => a-b); }",
    "class BinaryTree { constructor() { this.root = null; } }",
    "const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);",
    "async function fetchUserData() { return await api.get('/users'); }",
    "const [state, setState] = useState(initialValue);",
    "SELECT * FROM interviews WHERE status = 'passed';",
    "def merge_sort(arr): return sorted(arr)",
    "import React, { useEffect, useState } from 'react';",
    "const memoized = useMemo(() => expensive(), [deps]);",
    "git commit -m 'Fix: interview preparation logic'",
    "docker run -p 3000:3000 interview-app",
    "export const InterviewConfig = { timeout: 3600 };",
  ];

  const features = [
    {
      icon: Code,
      title: "Smart DSA Practice",
      description:
        "AI-curated coding challenges that adapt to your skill level. Practice 1000+ problems from top companies with real-time hints and solutions.",
      href: "/login",
      color: "from-blue-500 via-blue-600 to-cyan-500",
      badge: "Most Popular",
    },
    {
      icon: Brain,
      title: "AI Interview Coach",
      description:
        "Get personalized feedback on your interview performance. Our AI analyzes your responses and provides actionable improvement suggestions.",
      href: "/login",
      color: "from-purple-500 via-purple-600 to-pink-500",
      badge: "AI Powered",
    },
    {
      icon: FileUp,
      title: "Document Intelligence",
      description:
        "Upload your resume, job descriptions, or study materials. Our AI creates custom practice questions and interview scenarios.",
      href: "/login",
      color: "from-green-500 via-green-600 to-emerald-500",
      badge: "Smart Upload",
    },
    {
      icon: Target,
      title: "Mock Interviews",
      description:
        "Practice with realistic interview simulations. Record yourself, get AI feedback, and track your improvement over time.",
      href: "/login",
      color: "from-orange-500 via-orange-600 to-red-500",
      badge: "Practice Mode",
    },
    {
      icon: Network,
      title: "Visual Learning Maps",
      description:
        "Transform complex concepts into interactive mind maps. Visualize algorithms, system designs, and technical concepts.",
      href: "/login",
      color: "from-teal-500 via-teal-600 to-blue-500",
      badge: "Visual",
    },
    {
      icon: Calendar,
      title: "Personalized Roadmaps",
      description:
        "Get a custom study plan based on your target role, timeline, and current skill level. Track progress with smart analytics.",
      href: "/login",
      color: "from-indigo-500 via-indigo-600 to-purple-500",
      badge: "Custom Plan",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content:
        "InterviewBuddy's AI coach helped me identify my weak spots and practice systematically. Landed my dream job in 3 months!",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Marcus Rodriguez",
      role: "Senior Developer at Microsoft",
      content:
        "The mock interviews felt so real. The AI feedback was incredibly detailed and helped me improve my communication skills.",
      rating: 5,
      avatar: "MR",
    },
    {
      name: "Priya Patel",
      role: "Tech Lead at Amazon",
      content:
        "Best investment I made for my career. The personalized roadmap kept me focused and the progress tracking was motivating.",
      rating: 5,
      avatar: "PP",
    },
  ];

  const stats = [
    { icon: Users, value: "50K+", label: "Success Stories" },
    { icon: Trophy, value: "98%", label: "Success Rate" },
    { icon: Code, value: "1000+", label: "Practice Problems" },
    { icon: Clock, value: "24/7", label: "AI Support" },
  ];

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [features.length]);
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Navbar />
      {/* Dynamic mouse follower */}
      {mounted && (
        <motion.div
          className="fixed w-6 h-6 bg-blue-500/20 rounded-full pointer-events-none z-50 mix-blend-multiply dark:mix-blend-screen"
          animate={{
            x: mousePosition.x - 12,
            y: mousePosition.y - 12,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      )}

      {/* Flying code snippets */}
      {mounted && (
        <>
          {codeSnippets.map((snippet, index) => (
            <motion.div
              key={index}
              className="fixed pointer-events-none font-mono text-xs whitespace-nowrap text-blue-500/30 dark:text-blue-400/30 z-10"
              initial={{
                x: index % 2 === 0 ? -300 : window.innerWidth + 300,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                x: index % 2 === 0 ? window.innerWidth + 300 : -300,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: Math.random() * 25 + 20,
                ease: "linear",
                delay: Math.random() * 15,
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
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.8, 0.4],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />

          {/* Floating geometric shapes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-${4 + (i % 3) * 2} h-${4 + (i % 3) * 2} ${
                i % 3 === 0
                  ? "rounded-full"
                  : i % 3 === 1
                  ? "rounded-lg"
                  : "rounded-md rotate-45"
              } bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20`}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 50 - 25, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
              style={{
                left: `${10 + (i * 15) % 80}%`,
                top: `${20 + (i * 10) % 60}%`,
              }}
            />
          ))}

          <div className="relative z-20 text-center max-w-6xl mx-auto">
            {/* Brand header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 mb-8 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InterviewBuddy AI
              </span>
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Beta
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold mb-8 leading-tight">
                Master Your Next
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Technical Interview
                </span>
                <br />
                <span className="text-2xl md:text-4xl text-muted-foreground font-medium">
                  with AI-Powered Precision
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Transform your interview preparation with personalized AI coaching,
              adaptive practice problems, and real-time feedback. Join 50,000+
              developers who've accelerated their careers.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
                  asChild
                >
                  <Link href="/login" className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Start Free Trial
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>

              <Button
                size="lg"
                variant="outline"
                className="px-10 py-6 text-lg border-2 backdrop-blur-sm bg-white/5 hover:bg-white/10"
                asChild
              >
                <Link href="/login" className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Floating code blocks */}
          <motion.div
            className="hidden xl:block absolute -left-10 top-1/3 w-96 h-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl"
            initial={{ x: -400, rotate: -15, opacity: 0 }}
            animate={{ x: 0, rotate: -15, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.5 }}
            whileHover={{
              x: 30,
              y: -10,
              rotate: -10,
              transition: { duration: 0.3 },
            }}
          >
            {/* ...existing code... */}
            <div className="p-6 font-mono text-sm">
              <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-blue-600">function</div>
              <div className="pl-2">
                <span className="text-purple-600">solveInterview</span>
                <span>(candidate) {'{'}</span>
              </div>
              <div className="pl-4 text-green-600">// AI-powered preparation</div>
              <div className="pl-4">const success = ai.coach(candidate);</div>
              <div className="pl-4">return success.probability;</div>
              <div className="pl-2">{'}'}</div>
            </div>
          </motion.div>

          <motion.div
            className="hidden xl:block absolute -right-10 top-2/3 w-96 h-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl"
            initial={{ x: 400, rotate: 15, opacity: 0 }}
            animate={{ x: 0, rotate: 15, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.8 }}
            whileHover={{
              x: -30,
              y: -10,
              rotate: 10,
              transition: { duration: 0.3 },
            }}
          >
            {/* ...existing code... */}
            <div className="p-6 font-mono text-sm">
              <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-orange-600">class</div>
              <div className="pl-2">
                <span className="text-blue-600">InterviewPrep</span>
                <span> {'{'}</span>
              </div>
              <div className="pl-4">constructor() {'{'}</div>
              <div className="pl-6">this.ai = new AICoach();</div>
              <div className="pl-6">this.success_rate = 0.98;</div>
              <div className="pl-4">{'}'}</div>
              <div className="pl-2">{'}'}</div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-blue-500/10 text-blue-600 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Rocket className="inline-block w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Succeed
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive interview preparation tools powered by cutting-edge AI
              technology
            </p>
          </motion.div>

          {/* Featured card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-6xl mx-auto mb-16"
          >
            <Card className="overflow-hidden border-blue-200/50 shadow-2xl bg-gradient-to-br from-white/50 to-blue-50/50 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="inline-block bg-blue-500/10 text-blue-600 rounded-full px-3 py-1 text-sm font-medium mb-4">
                    {features[activeFeatureIndex].badge}
                  </div>
                  <div className="bg-blue-500/10 w-16 h-16 flex items-center justify-center rounded-2xl mb-6">
                    {React.createElement(
                      features[activeFeatureIndex].icon,
                      { className: "h-8 w-8 text-blue-600" }
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    {features[activeFeatureIndex].title}
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                    {features[activeFeatureIndex].description}
                  </p>
                  <Button size="lg" asChild className="w-fit">
                    <Link
                      href={features[activeFeatureIndex].href}
                      className="gap-2"
                    >
                      Explore Feature{" "}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div
                  className={`bg-gradient-to-br ${features[activeFeatureIndex].color} p-8 md:p-12 text-white flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 text-center">
                    {React.createElement(
                      features[activeFeatureIndex].icon,
                      { className: "h-32 w-32 mx-auto mb-4 opacity-90" }
                    )}
                    <div className="text-white/80 text-lg font-medium">
                      {features[activeFeatureIndex].badge}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card
                  className="h-full bg-white/50 backdrop-blur-sm border-white/20 hover:border-blue-300/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group cursor-pointer"
                  onMouseEnter={() => setActiveFeatureIndex(index)}
                  onClick={() => (window.location.href = feature.href)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`bg-gradient-to-r ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                        {feature.badge}
                      </div>
                    </div>
                    <CardTitle className="flex items-center text-xl">
                      {feature.title}
                      {index === activeFeatureIndex && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="ml-2"
                        >
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        </motion.div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full group-hover:bg-blue-50 transition-colors"
                    >
                      <Link
                        href={feature.href}
                        className="flex items-center justify-between"
                      >
                        <span>Learn More</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-green-500/10 text-green-600 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Users className="inline-block w-4 h-4 mr-2" />
              Success Stories
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Loved by
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {" "}
                Developers
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full bg-white/60 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>
                    <CardDescription className="text-base italic leading-relaxed">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl"></div>

          <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-6 py-2 text-sm font-medium mb-6">
                <Globe className="inline-block w-4 h-4 mr-2" />
                Join 50,000+ Developers
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Ace Your Next Interview?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Start your journey today with our AI-powered interview preparation
                platform. Get personalized coaching, practice with real questions,
                and land your dream job.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold shadow-xl"
                    asChild
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      Start Free Trial
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>

                <Button
                  size="lg"
                  variant="outline"
                  className="px-12 py-6 text-lg border-2 bg-white/50 backdrop-blur-sm"
                  asChild
                >
                  <Link href="/login">View Pricing</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  7-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

