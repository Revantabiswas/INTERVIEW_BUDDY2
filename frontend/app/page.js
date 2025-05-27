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
  GraduationCap,
  Atom,
  Calculator,
  FlaskConical,
  Microscope,
  BookText,
  PenTool,
  TrendingUp,
  Award,
  BarChart3,
  Lightbulb,
  Gamepad2,
  Palette,
  Monitor,
  Smartphone,
  Beaker,
  Stethoscope,
  Building2,
  Plane,
  Briefcase,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('coding');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Enhanced code snippets with academic subjects
  const codeSnippets = [
    "function quickSort(arr) { return arr.sort((a,b) => a-b); }",
    "∫x²dx = x³/3 + C",
    "class BinaryTree { constructor() { this.root = null; } }",
    "2H₂ + O₂ → 2H₂O",
    "const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);",
    "F = ma (Newton's Second Law)",
    "async function fetchUserData() { return await api.get('/users'); }",
    "DNA → RNA → Protein",
    "SELECT * FROM interviews WHERE status = 'passed';",
    "d/dx(sin x) = cos x",
    "def merge_sort(arr): return sorted(arr)",
    "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP",
    "import React, { useEffect, useState } from 'react';",
    "E = mc²",
    "git commit -m 'Fix: JEE preparation logic'",
    "Mitochondria - Powerhouse of cell",
  ];

  // Enhanced features with academic subjects
  const features = [
    {
      icon: Code,
      title: "Smart DSA Practice",
      description: "AI-curated coding challenges that adapt to your skill level. Practice 1000+ problems from top companies with real-time hints and solutions.",
      href: "/login",
      color: "from-blue-500 via-blue-600 to-cyan-500",
      badge: "Most Popular",
      category: "coding"
    },
    {
      icon: Calculator,
      title: "JEE Math Mastery",
      description: "Comprehensive JEE mathematics preparation with adaptive learning. Master calculus, algebra, trigonometry with AI-powered problem solving.",
      href: "/login",
      color: "from-purple-500 via-purple-600 to-pink-500",
      badge: "JEE Prep",
      category: "academic"
    },
    {
      icon: Atom,
      title: "Physics Lab Simulator",
      description: "Interactive physics experiments and problem solving for JEE/NEET. Visualize concepts with 3D animations and practice numerical problems.",
      href: "/login",
      color: "from-orange-500 via-red-500 to-pink-500",
      badge: "Interactive",
      category: "academic"
    },
    {
      icon: FlaskConical,
      title: "Chemistry Problem Bank",
      description: "Master organic, inorganic, and physical chemistry for JEE/NEET. AI explains complex reactions and mechanisms step by step.",
      href: "/login",
      color: "from-green-500 via-emerald-500 to-teal-500",
      badge: "AI Tutor",
      category: "academic"
    },
    {
      icon: Microscope,
      title: "Biology NEET Prep",
      description: "Complete NEET biology preparation with detailed diagrams, mnemonics, and practice tests. Covers botany, zoology, and human physiology.",
      href: "/login",
      color: "from-cyan-500 via-blue-500 to-indigo-500",
      badge: "NEET Ready",
      category: "academic"
    },
    {
      icon: Brain,
      title: "AI Interview Coach",
      description: "Get personalized feedback on your interview performance. Our AI analyzes your responses and provides actionable improvement suggestions.",
      href: "/login",
      color: "from-violet-500 via-purple-600 to-indigo-500",
      badge: "AI Powered",
      category: "coding"
    },
    {
      icon: BookText,
      title: "10th & 12th Board Prep",
      description: "Complete board exam preparation with NCERT solutions, previous years' papers, and chapter-wise tests for all subjects.",
      href: "/login",
      color: "from-rose-500 via-pink-500 to-red-500",
      badge: "Board Ready",
      category: "academic"
    },
    {
      icon: FileUp,
      title: "Document Intelligence",
      description: "Upload your resume, job descriptions, or study materials. Our AI creates custom practice questions and interview scenarios.",
      href: "/login",
      color: "from-amber-500 via-yellow-500 to-orange-500",
      badge: "Smart Upload",
      category: "coding"
    },
    {
      icon: Target,
      title: "Mock Tests & Analysis",
      description: "Take full-length mock tests for JEE, NEET, board exams. Get detailed analysis, rank prediction, and improvement strategies.",
      href: "/login",
      color: "from-lime-500 via-green-500 to-emerald-500",
      badge: "Test Mode",
      category: "academic"
    },
    {
      icon: Network,
      title: "Visual Learning Maps",
      description: "Transform complex concepts into interactive mind maps. Visualize algorithms, chemical reactions, biological processes, and physics concepts.",
      href: "/login",
      color: "from-sky-500 via-cyan-500 to-blue-500",
      badge: "Visual",
      category: "both"
    },
    {
      icon: Calendar,
      title: "Personalized Study Plans",
      description: "Get custom study plans for JEE, NEET, board exams, or coding interviews. AI adapts to your pace and performance.",
      href: "/login",
      color: "from-fuchsia-500 via-purple-500 to-indigo-500",
      badge: "Custom Plan",
      category: "both"
    },
    {
      icon: Gamepad2,
      title: "Gamified Learning",
      description: "Learn through interactive games and challenges. Earn points, badges, and compete with friends while studying.",
      href: "/login",
      color: "from-pink-500 via-rose-500 to-red-500",
      badge: "Fun Mode",
      category: "both"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Features', icon: Sparkles, color: 'from-blue-500 to-purple-500' },
    { id: 'coding', name: 'Coding & Interviews', icon: Code, color: 'from-green-500 to-blue-500' },
    { id: 'academic', name: 'Academic Prep', icon: GraduationCap, color: 'from-orange-500 to-red-500' },
    { id: 'both', name: 'Universal Tools', icon: Zap, color: 'from-purple-500 to-pink-500' },
  ];

  const testimonials = [
    {
      name: "Arjun Sharma",
      role: "JEE Advanced AIR 42",
      content: "The AI-powered physics simulations and math problem solving helped me crack JEE Advanced. The visual learning approach made complex concepts crystal clear!",
      rating: 5,
      avatar: "AS",
      subject: "JEE",
      color: "from-blue-500 to-purple-500"
    },
    {
      name: "Priya Nair",
      role: "NEET AIR 128",
      content: "The biology diagrams and mnemonics were game-changers. Mock tests with AI analysis helped me identify weak areas and improve systematically.",
      rating: 5,
      avatar: "PN",
      subject: "NEET",
      color: "from-green-500 to-cyan-500"
    },
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "InterviewBuddy's AI coach helped me identify my weak spots and practice systematically. Landed my dream job in 3 months!",
      rating: 5,
      avatar: "SC",
      subject: "Tech",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "Rohan Gupta",
      role: "Class 12 - 98.2% CBSE",
      content: "Board exam preparation became so much easier with personalized study plans and chapter-wise tests. Scored 98.2% in boards!",
      rating: 5,
      avatar: "RG",
      subject: "Boards",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Marcus Rodriguez",
      role: "Senior Developer at Microsoft",
      content: "The mock interviews felt so real. The AI feedback was incredibly detailed and helped me improve my communication skills.",
      rating: 5,
      avatar: "MR",
      subject: "Tech",
      color: "from-cyan-500 to-blue-500"
    },
    {
      name: "Kavya Reddy",
      role: "Medical Student at AIIMS",
      content: "The chemistry reaction mechanisms and organic chemistry tutorials were phenomenal. Made my NEET preparation so much more effective!",
      rating: 5,
      avatar: "KR",
      subject: "NEET",
      color: "from-pink-500 to-rose-500"
    },
  ];

  const stats = [
    { icon: Users, value: "100K+", label: "Success Stories", color: "text-blue-500" },
    { icon: Trophy, value: "96%", label: "Success Rate", color: "text-green-500" },
    { icon: Code, value: "5000+", label: "Practice Problems", color: "text-purple-500" },
    { icon: GraduationCap, value: "50+", label: "Subjects Covered", color: "text-orange-500" },
    { icon: Brain, value: "24/7", label: "AI Support", color: "text-pink-500" },
    { icon: Award, value: "1000+", label: "Top Ranks", color: "text-cyan-500" },
  ];
  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(() => {
      const filteredFeatures = activeCategory === 'all' ? features : features.filter(f => f.category === activeCategory || f.category === 'both');
      setActiveFeatureIndex((prev) => (prev + 1) % filteredFeatures.length);
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [features.length, activeCategory]);

  const getFilteredFeatures = () => {
    if (activeCategory === 'all') return features;
    return features.filter(f => f.category === activeCategory || f.category === 'both');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-50 via-pink-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Navbar />
      
      {/* Enhanced dynamic mouse follower with colors */}
      {mounted && (
        <>
          <motion.div
            className="fixed w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none z-50 mix-blend-multiply dark:mix-blend-screen opacity-60"
            animate={{
              x: mousePosition.x - 16,
              y: mousePosition.y - 16,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          />
          <motion.div
            className="fixed w-4 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full pointer-events-none z-50 mix-blend-multiply dark:mix-blend-screen opacity-40"
            animate={{
              x: mousePosition.x - 8,
              y: mousePosition.y - 8,
            }}
            transition={{ type: "spring", stiffness: 700, damping: 30, delay: 0.05 }}
          />
        </>
      )}

      {/* Enhanced flying snippets with colorful backgrounds */}
      {mounted && (
        <>
          {codeSnippets.map((snippet, index) => (
            <motion.div
              key={index}
              className={`fixed pointer-events-none font-mono text-xs whitespace-nowrap z-10 px-3 py-2 rounded-full backdrop-blur-sm border ${
                index % 4 === 0 ? 'text-blue-600 bg-blue-100/70 border-blue-200' :
                index % 4 === 1 ? 'text-purple-600 bg-purple-100/70 border-purple-200' :
                index % 4 === 2 ? 'text-green-600 bg-green-100/70 border-green-200' :
                'text-orange-600 bg-orange-100/70 border-orange-200'
              } dark:text-blue-400/60 dark:bg-blue-900/20 dark:border-blue-800/30`}
              initial={{
                x: index % 2 === 0 ? -300 : window.innerWidth + 300,
                y: Math.random() * window.innerHeight,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              animate={{
                x: index % 2 === 0 ? window.innerWidth + 300 : -300,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.9, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: Math.random() * 25 + 30,
                ease: "linear",
                delay: Math.random() * 20,
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              {snippet}
            </motion.div>
          ))}
        </>
      )}

      <div className="container mx-auto px-4 py-8">        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Enhanced animated background elements with vibrant colors */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.8, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 blur-3xl"
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.5, 0.9, 0.5],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-500/15 to-green-500/15 blur-3xl"
            animate={{
              scale: [1.1, 1.5, 1.1],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />

          {/* Enhanced floating geometric shapes with rainbow colors */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-${4 + (i % 4) * 2} h-${4 + (i % 4) * 2} ${
                i % 4 === 0 ? "rounded-full bg-gradient-to-br from-red-400/30 to-pink-400/30" :
                i % 4 === 1 ? "rounded-lg bg-gradient-to-br from-blue-400/30 to-cyan-400/30" :
                i % 4 === 2 ? "rounded-md rotate-45 bg-gradient-to-br from-green-400/30 to-emerald-400/30" :
                "rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-400/30"
              } backdrop-blur-sm border border-white/30 shadow-lg`}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 60 - 30, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 12 + 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 8,
              }}
              style={{
                left: `${5 + (i * 12) % 90}%`,
                top: `${15 + (i * 8) % 70}%`,
              }}
            />
          ))}

          <div className="relative z-20 text-center max-w-6xl mx-auto">
            {/* Enhanced brand header with colorful design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-4 mb-8 bg-white/20 backdrop-blur-md rounded-full px-8 py-4 border border-white/30 shadow-xl"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                StudyBuddy AI
              </span>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                ✨ New
              </div>
            </motion.div>

            {/* Enhanced main headline with gradient text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold mb-8 leading-tight">
                Master Everything From
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  JEE, NEET to Coding
                </span>
                <br />
                <span className="text-2xl md:text-4xl text-muted-foreground font-medium">
                  Your AI-Powered Study Companion
                </span>
              </h1>
            </motion.div>

            {/* Enhanced subtitle */}
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              From 10th board exams to JEE/NEET preparation and tech interviews - 
              our AI adapts to your learning style. Join 100,000+ students and professionals 
              who've transformed their academic and career journey.
            </motion.p>

            {/* Enhanced CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-12 py-6 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all border-0"
                  asChild
                >
                  <Link href="/login" className="flex items-center gap-3">
                    <PlayCircle className="h-6 w-6" />
                    Start Free Journey
                    <ChevronRight className="h-6 w-6" />
                  </Link>
                </Button>
              </motion.div>

              <Button
                size="lg"
                variant="outline"
                className="px-12 py-6 text-lg border-2 border-purple-300 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-purple-700 hover:text-purple-800 shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link href="/login" className="flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Enhanced stats with colorful icons */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all shadow-lg hover:shadow-xl"
                  whileHover={{ y: -8, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Enhanced floating code blocks with colorful themes */}
          <motion.div
            className="hidden xl:block absolute -left-10 top-1/3 w-96 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-blue-200/50 rounded-2xl shadow-2xl"
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
            <div className="p-6 font-mono text-sm">
              <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-blue-600 font-semibold">function</div>
              <div className="pl-2">
                <span className="text-purple-600 font-semibold">solveProblem</span>
                <span>(subject, difficulty) {'{'}</span>
              </div>
              <div className="pl-4 text-green-600">// AI adapts to your level</div>
              <div className="pl-4">const solution = ai.generateHints();</div>
              <div className="pl-4">return success.guaranteed;</div>
              <div className="pl-2">{'}'}</div>
            </div>
          </motion.div>

          <motion.div
            className="hidden xl:block absolute -right-10 top-2/3 w-96 h-64 bg-gradient-to-br from-pink-500/10 to-orange-500/10 backdrop-blur-md border border-pink-200/50 rounded-2xl shadow-2xl"
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
            <div className="p-6 font-mono text-sm">
              <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-orange-600 font-semibold">class</div>
              <div className="pl-2">
                <span className="text-blue-600 font-semibold">StudyBuddy</span>
                <span> {'{'}</span>
              </div>
              <div className="pl-4">constructor() {'{'}</div>
              <div className="pl-6">this.subjects = ['JEE', 'NEET', 'Coding'];</div>
              <div className="pl-6">this.success_rate = 0.96;</div>
              <div className="pl-4">{'}'}</div>
              <div className="pl-2">{'}'}</div>
            </div>
          </motion.div>
        </section>        {/* Features Section */}
        <section className="py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 rounded-full px-6 py-3 text-sm font-medium mb-6 border border-blue-200/50 shadow-lg">
              <Rocket className="inline-block w-5 h-5 mr-2" />
              Powerful Learning Tools
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {" "}
                Excel & Succeed
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              From academic excellence to career success - our AI-powered platform covers it all
            </p>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-xl scale-105`
                      : 'bg-white/50 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/70'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <category.icon className="w-5 h-5" />
                  {category.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Featured card with enhanced colors */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-6xl mx-auto mb-16"
          >
            {(() => {
              const filteredFeatures = getFilteredFeatures();
              const currentFeature = filteredFeatures[activeFeatureIndex % filteredFeatures.length];
              return (
                <Card className="overflow-hidden border-blue-200/50 shadow-2xl bg-gradient-to-br from-white/60 to-blue-50/60 backdrop-blur-sm">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className={`inline-block bg-gradient-to-r ${currentFeature.color} text-white rounded-full px-4 py-2 text-sm font-medium mb-4 shadow-lg`}>
                        {currentFeature.badge}
                      </div>
                      <div className={`bg-gradient-to-r ${currentFeature.color} w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-lg`}>
                        {React.createElement(
                          currentFeature.icon,
                          { className: "h-8 w-8 text-white" }
                        )}
                      </div>
                      <h3 className="text-3xl font-bold mb-4">
                        {currentFeature.title}
                      </h3>
                      <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                        {currentFeature.description}
                      </p>
                      <Button size="lg" asChild className={`w-fit bg-gradient-to-r ${currentFeature.color} text-white hover:shadow-xl transition-all`}>
                        <Link
                          href={currentFeature.href}
                          className="gap-2"
                        >
                          Explore Feature{" "}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div
                      className={`bg-gradient-to-br ${currentFeature.color} p-8 md:p-12 text-white flex items-center justify-center relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm"
                            animate={{
                              x: [0, 100, 0],
                              y: [0, -50, 0],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: Math.random() * 8 + 10,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: Math.random() * 5,
                            }}
                            style={{
                              left: `${Math.random() * 80}%`,
                              top: `${Math.random() * 80}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="relative z-10 text-center">
                        {React.createElement(
                          currentFeature.icon,
                          { className: "h-32 w-32 mx-auto mb-4 opacity-90" }
                        )}
                        <div className="text-white/90 text-lg font-medium">
                          {currentFeature.badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </motion.div>

          {/* Enhanced Features grid with filtering */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {getFilteredFeatures().map((feature, index) => (
              <motion.div
                key={`${feature.title}-${activeCategory}`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className="h-full bg-white/60 backdrop-blur-sm border-white/30 hover:border-blue-300/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 overflow-hidden group cursor-pointer"
                  onMouseEnter={() => setActiveFeatureIndex(index)}
                  onClick={() => (window.location.href = feature.href)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`bg-gradient-to-r ${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}
                      >
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className={`bg-gradient-to-r ${feature.color} text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg`}>
                        {feature.badge}
                      </div>
                    </div>
                    <CardTitle className="flex items-center text-xl mb-2">
                      {feature.title}
                      {index === (activeFeatureIndex % getFilteredFeatures().length) && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="ml-2"
                        >
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        </motion.div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full group-hover:bg-gradient-to-r group-hover:${feature.color} group-hover:text-white transition-all`}
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
        </section>        {/* Enhanced Testimonials Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-green-400/20 to-blue-400/20 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5,
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 relative z-10"
          >
            <div className="inline-block bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 rounded-full px-6 py-3 text-sm font-medium mb-6 border border-green-200/50 shadow-lg">
              <Users className="inline-block w-5 h-5 mr-2" />
              Success Stories
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Loved by
              <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {" "}
                Students & Professionals
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands who've achieved their academic and career goals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto relative z-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Card className={`h-full bg-white/70 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 relative overflow-hidden group`}>
                  {/* Colorful accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.color}`} />
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-amber-400 fill-amber-400"
                          />
                        ))}
                      </div>
                      <div className={`bg-gradient-to-r ${testimonial.color} text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg`}>
                        {testimonial.subject}
                      </div>
                    </div>
                    <CardDescription className="text-base italic leading-relaxed text-gray-700 mb-4">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardFooter>
                  
                  {/* Hover effect overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                </Card>
              </motion.div>
            ))}
          </div>
        </section>        {/* Enhanced Final CTA */}
        <section className="py-24 relative overflow-hidden">
          {/* Multi-layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/5 via-emerald-500/5 to-blue-500/5 rounded-3xl"></div>
          
          {/* Animated background elements */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-pink-400/30 to-orange-400/30 blur-2xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
              x: [0, -40, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />

          <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-full px-8 py-3 text-sm font-medium mb-8 shadow-xl">
                <Globe className="inline-block w-5 h-5 mr-2" />
                Join 100,000+ Success Stories
              </div>
              
              <h2 className="text-3xl md:text-6xl font-bold mb-8 leading-tight">
                Ready to Transform Your
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  Academic & Career Journey?
                </span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                Whether you're preparing for JEE, NEET, board exams, or tech interviews - 
                our AI-powered platform adapts to your needs. Start your success story today 
                with personalized learning paths and expert guidance.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-14 py-7 text-xl font-semibold shadow-2xl hover:shadow-3xl border-0 rounded-full"
                    asChild
                  >
                    <Link href="/login" className="flex items-center gap-3">
                      <Rocket className="h-6 w-6" />
                      Start Your Journey Free
                      <ChevronRight className="h-6 w-6" />
                    </Link>
                  </Button>
                </motion.div>

                <Button
                  size="lg"
                  variant="outline"
                  className="px-14 py-7 text-xl border-2 border-purple-300 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-purple-700 hover:text-purple-800 shadow-xl hover:shadow-2xl transition-all rounded-full"
                  asChild
                >
                  <Link href="/login" className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    View Success Analytics
                  </Link>
                </Button>
              </div>

              {/* Enhanced feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-4 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="font-medium">No credit card required</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-4 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  <span className="font-medium">14-day free trial</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-4 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-purple-500" />
                  <span className="font-medium">Cancel anytime</span>
                </div>
              </div>

              {/* Trust indicators with colors */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span>100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <span>AI-Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span>96% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <span>Expert Backed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

