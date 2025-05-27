"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Award,
  CheckCircle,
  PlayCircle,
  Users,
  BarChart3,
  Activity,
  BookmarkPlus,
  Lightbulb,
  Timer,
  Flame,
  ArrowUpRight
} from "lucide-react";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);  const [userName] = useState("Revanta");
  const [currentStreak, setCurrentStreak] = useState(7);
  const [studyTime, setStudyTime] = useState(142);
  const [chaptersCompleted, setChaptersCompleted] = useState(42);
  const [testsAttempted, setTestsAttempted] = useState(18);
  const [selectedGrade, setSelectedGrade] = useState("12th");
  const [selectedExam, setSelectedExam] = useState("JEE");

  useEffect(() => {
    setMounted(true);
  }, []);
  // Dashboard analytics data
  const weeklyProgress = [
    { day: "Mon", problems: 5, time: 45, label: "chapters" },
    { day: "Tue", problems: 8, time: 65, label: "practice tests" },
    { day: "Wed", problems: 3, time: 30, label: "assignments" },
    { day: "Thu", problems: 12, time: 90, label: "topics" },
    { day: "Fri", problems: 6, time: 40, label: "mock tests" },
    { day: "Sat", problems: 15, time: 120, label: "exercises" },
    { day: "Sun", problems: 9, time: 60, label: "revisions" }
  ];
  const recentActivity = [
    { id: 1, type: "study", title: "Quadratic Equations Practice", difficulty: "Medium", completed: true, time: "2 hours ago" },
    { id: 2, type: "test", title: "Physics Mock Test - Mechanics", difficulty: "Hard", completed: false, time: "5 hours ago" },
    { id: 3, type: "chat", title: "Asked about Organic Chemistry", difficulty: "Easy", completed: true, time: "1 day ago" },
    { id: 4, type: "assignment", title: "Biology Lab Report", difficulty: "Medium", completed: true, time: "2 days ago" }
  ];
  const quickActions = [
    {
      icon: BookOpen,
      title: "Mathematics",
      description: "Algebra, Geometry, Calculus",
      href: "/dashboard/mathematics",
      color: "bg-gradient-to-r from-blue-500 to-cyan-400",
      badge: "All Grades"
    },
    {
      icon: Brain,
      title: "Physics",
      description: "Mechanics, Thermodynamics",
      href: "/dashboard/physics",
      color: "bg-gradient-to-r from-green-500 to-emerald-400",
      badge: "JEE Ready"
    },
    {
      icon: Target,
      title: "Chemistry",
      description: "Organic, Inorganic, Physical",
      href: "/dashboard/chemistry",
      color: "bg-gradient-to-r from-purple-500 to-pink-400",
      badge: "Lab Included"
    },
    {
      icon: Activity,
      title: "Biology",
      description: "Botany, Zoology, Genetics",
      href: "/dashboard/biology",
      color: "bg-gradient-to-r from-yellow-500 to-amber-400",
      badge: "NEET Prep"
    },
    {
      icon: Trophy,
      title: "Test Generator",
      description: "Custom practice tests",
      href: "/dashboard/test-generator",
      color: "bg-gradient-to-r from-red-500 to-orange-400",
      badge: "AI Generated"
    },
    {
      icon: MessageSquare,
      title: "AI Tutor",
      description: "Get instant help",
      href: "/dashboard/ai-tutor",
      color: "bg-gradient-to-r from-indigo-500 to-purple-400",
      badge: "24/7 Available"
    }
  ];
  const subjectProgress = [
    { subject: "Mathematics - Class 12", progress: 85, total: 60, completed: 51 },
    { subject: "Physics - JEE Preparation", progress: 72, total: 45, completed: 32 },
    { subject: "Chemistry - Organic", progress: 68, total: 40, completed: 27 },
    { subject: "Biology - NEET Prep", progress: 45, total: 50, completed: 22 }
  ];
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Ready to ace your studies and excel in your exams today?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Study Time
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Trophy className="h-4 w-4" />
                View Achievements
              </Button>            </div>
          </div>
        </div>
      </div>

      {/* Grade & Exam Selector */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Grade:</span>
                <Tabs value={selectedGrade} onValueChange={setSelectedGrade}>
                  <TabsList className="bg-white/80 dark:bg-slate-700/80">
                    <TabsTrigger value="10th">Class 10th</TabsTrigger>
                    <TabsTrigger value="12th">Class 12th</TabsTrigger>
                    <TabsTrigger value="college">College</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exam:</span>
                <Tabs value={selectedExam} onValueChange={setSelectedExam}>
                  <TabsList className="bg-white/80 dark:bg-slate-700/80">
                    <TabsTrigger value="JEE">JEE</TabsTrigger>
                    <TabsTrigger value="NEET">NEET</TabsTrigger>
                    <TabsTrigger value="Boards">Boards</TabsTrigger>
                    <TabsTrigger value="Custom">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Trophy className="h-4 w-4" />
                Generate Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Current Streak</p>
                    <p className="text-3xl font-bold">{currentStreak} days</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Flame className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-orange-100">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm">Keep it going!</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Study Time</p>
                    <p className="text-3xl font-bold">{studyTime}h</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Clock className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-blue-100">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">This month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Chapters Completed</p>
                    <p className="text-3xl font-bold">{chaptersCompleted}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-green-100">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">This month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Tests Attempted</p>
                    <p className="text-3xl font-bold">{testsAttempted}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-purple-100">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">This week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Exam Preparation Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    Exam Preparation
                  </CardTitle>
                  <CardDescription>
                    Specialized preparation for {selectedExam} exam
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700/50 hover:scale-105">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Mock Tests</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {selectedExam} pattern tests
                        </p>
                        <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                          Start Test
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700/50 hover:scale-105">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">Time Practice</h3>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Speed & accuracy
                        </p>
                        <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700">
                          Practice
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700/50 hover:scale-105">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200">Analytics</h3>
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                          Performance insights
                        </p>
                        <Button size="sm" className="mt-3 bg-purple-600 hover:bg-purple-700">
                          View Report
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Academic Subjects
                  </CardTitle>
                  <CardDescription>
                    Choose your study area and start learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                      <Link key={index} href={action.href}>
                        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-800/80 border-0 hover:scale-105">
                          <CardContent className="p-4">
                            <div className={`inline-flex p-3 rounded-lg ${action.color} mb-3`}>
                              <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {action.description}
                            </p>
                            <div className="mt-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {action.badge}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Charts */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Weekly Progress
                  </CardTitle>
                  <CardDescription>
                    Your academic activity this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weeklyProgress.map((day, index) => (
                      <div key={day.day} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {day.day}
                          </span>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 min-w-[200px]">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(day.problems / 15) * 100}%` }}
                            />
                          </div>
                        </div>                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {day.problems} {day.label || "activities"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {day.time}m
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subject Progress */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-500" />
                    Subject Progress
                  </CardTitle>
                  <CardDescription>
                    Track your progress across different topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {subjectProgress.map((subject, index) => (
                      <div key={subject.subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">
                            {subject.subject}
                          </h4>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {subject.completed}/{subject.total}
                          </span>
                        </div>
                        <Progress value={subject.progress} className="h-2" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {subject.progress}% complete
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">                        <div className={`p-2 rounded-lg ${
                          activity.type === 'study' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          activity.type === 'test' ? 'bg-green-100 dark:bg-green-900/20' :
                          activity.type === 'chat' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-orange-100 dark:bg-orange-900/20'
                        }`}>
                          {activity.type === 'study' && <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          {activity.type === 'test' && <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />}
                          {activity.type === 'chat' && <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                          {activity.type === 'assignment' && <FileCode className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              activity.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              activity.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {activity.difficulty}
                            </span>
                            {activity.completed && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Study Roadmap */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-indigo-500" />
                    Study Roadmap
                  </CardTitle>
                  <CardDescription>
                    Your personalized academic journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold z-10">
                            ✓
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">
                              Class 10 Mathematics
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Board exam preparation
                            </p>
                            <div className="mt-2">
                              <Progress value={85} className="h-1" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold z-10">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">
                              JEE Main Physics
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Current focus area
                            </p>
                            <div className="mt-2">
                              <Progress value={72} className="h-1" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-400 text-sm font-semibold z-10">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-500 dark:text-slate-400">
                              NEET Biology
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                              Coming next
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

