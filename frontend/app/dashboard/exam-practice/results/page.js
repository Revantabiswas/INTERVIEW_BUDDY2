"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  Eye,
  BookOpen,
  Lightbulb,
  RefreshCw,
  Award,
  Brain
} from "lucide-react";
import { DownloadTestPDF } from "../components/DownloadPDF";
import { AdvancedAnalytics } from "../components/AdvancedAnalytics";

export default function TestResults() {
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState("summary");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sample test results data
  const testResults = {
    testTitle: "JEE Main Physics 2024 - Mock Test",
    totalQuestions: 30,
    attempted: 28,
    correct: 22,
    incorrect: 6,
    unattempted: 2,
    score: 82,
    maxScore: 120,
    percentile: 87.5,
    rank: 1250,
    totalCandidates: 10000,
    timeSpent: "52:34",
    accuracy: 78.6,
    subject: "Physics"
  };

  const questionAnalysis = [
    {
      id: 1,
      question: "A particle moves in a straight line with constant acceleration...",
      marks: 4,
      userAnswer: 1,
      correctAnswer: 1,
      status: "correct",
      timeSpent: "1:45",
      difficulty: "Medium",
      topic: "Kinematics",
      explanation: "Using equations of motion: s = ut + (1/2)at². For first 2 seconds: 20 = 2u + 2a. For next 4 seconds: 60 = 4u + 8a. Solving these equations gives u = 2 m/s."
    },
    {
      id: 2,
      question: "The electric field intensity at a point due to an infinite line charge...",
      marks: 4,
      userAnswer: 3,
      correctAnswer: 2,
      status: "incorrect",
      timeSpent: "2:20",
      difficulty: "Easy",
      topic: "Electrostatics",
      explanation: "For an infinite line charge, the electric field E ∝ 1/r, where r is the perpendicular distance from the line charge."
    },
    {
      id: 3,
      question: "A spring of spring constant 200 N/m is compressed by 10 cm...",
      marks: 4,
      userAnswer: null,
      correctAnswer: 1,
      status: "unattempted",
      timeSpent: "0:00",
      difficulty: "Easy",
      topic: "Work, Energy and Power",
      explanation: "Potential energy in spring = (1/2)kx² = (1/2) × 200 × (0.1)² = 1 J"
    }
  ];

  const topicAnalysis = [
    { topic: "Mechanics", attempted: 10, correct: 8, percentage: 80 },
    { topic: "Electromagnetism", attempted: 8, correct: 6, percentage: 75 },
    { topic: "Thermodynamics", attempted: 5, correct: 4, percentage: 80 },
    { topic: "Optics", attempted: 3, correct: 2, percentage: 67 },
    { topic: "Modern Physics", attempted: 2, correct: 2, percentage: 100 }
  ];

  const recommendations = [
    {
      type: "improvement",
      title: "Focus on Electromagnetism",
      description: "You scored 75% in this topic. Practice more problems on electric field and magnetic force.",
      priority: "high"
    },
    {
      type: "strength",
      title: "Strong in Modern Physics",
      description: "Perfect score! Keep up the good work in photoelectric effect and atomic structure.",
      priority: "low"
    },
    {
      type: "time-management",
      title: "Time Management",
      description: "You left 2 questions unattempted. Practice solving questions faster.",
      priority: "medium"
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Test Results & Analysis
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {testResults.testTitle}
              </p>
            </div>            <div className="flex items-center gap-4">
              <DownloadTestPDF testData={testResults} type="results" />
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Results
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <RefreshCw className="h-4 w-4" />
                Retake Test
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
        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Your Score</p>
                    <p className="text-3xl font-bold">{testResults.score}/{testResults.maxScore}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-green-100 text-sm">
                    {((testResults.score / testResults.maxScore) * 100).toFixed(1)}% Overall
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Percentile</p>
                    <p className="text-3xl font-bold">{testResults.percentile}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-blue-100 text-sm">
                    Better than {testResults.percentile}% candidates
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Rank</p>
                    <p className="text-3xl font-bold">{testResults.rank}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Award className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-purple-100 text-sm">
                    Out of {testResults.totalCandidates.toLocaleString()} candidates
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Accuracy</p>
                    <p className="text-3xl font-bold">{testResults.accuracy}%</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Target className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-orange-100 text-sm">
                    Time: {testResults.timeSpent}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="question-analysis" className="gap-2">
              <Eye className="h-4 w-4" />
              Question Analysis
            </TabsTrigger>
            <TabsTrigger value="topic-analysis" className="gap-2">
              <BookOpen className="h-4 w-4" />              Topic Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="advanced-analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div variants={itemVariants}>
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle>Question Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Correct Answers</span>
                        </div>
                        <span className="font-semibold">{testResults.correct}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span>Incorrect Answers</span>
                        </div>
                        <span className="font-semibold">{testResults.incorrect}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          <span>Unattempted</span>
                        </div>
                        <span className="font-semibold">{testResults.unattempted}</span>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Total Questions</span>
                          <span className="font-semibold">{testResults.totalQuestions}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle>Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Accuracy Rate</span>
                          <span className="text-sm font-medium">{testResults.accuracy}%</span>
                        </div>
                        <Progress value={testResults.accuracy} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Completion Rate</span>
                          <span className="text-sm font-medium">{((testResults.attempted / testResults.totalQuestions) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(testResults.attempted / testResults.totalQuestions) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Score Percentage</span>
                          <span className="text-sm font-medium">{((testResults.score / testResults.maxScore) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(testResults.score / testResults.maxScore) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Question Analysis Tab */}
          <TabsContent value="question-analysis">
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>Detailed Question Analysis</CardTitle>
                  <CardDescription>
                    Review each question with correct answers and explanations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {questionAnalysis.map((question, index) => (
                      <div key={question.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                              {question.id}
                            </span>
                            <div>
                              <p className="font-medium">Question {question.id}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{question.topic}</Badge>
                                <Badge variant={question.difficulty === 'Easy' ? 'secondary' : question.difficulty === 'Medium' ? 'default' : 'destructive'}>
                                  {question.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.status === 'correct' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {question.status === 'incorrect' && <XCircle className="h-6 w-6 text-red-500" />}
                            {question.status === 'unattempted' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                            <div className="text-right">
                              <p className="text-sm font-medium">+{question.marks} marks</p>
                              <p className="text-xs text-slate-500">{question.timeSpent}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-slate-700 dark:text-slate-300">{question.question}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Your Answer:</p>
                              <p className={`text-sm p-2 rounded ${
                                question.status === 'unattempted' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : question.status === 'correct'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {question.status === 'unattempted' 
                                  ? 'Not Attempted' 
                                  : `Option ${String.fromCharCode(65 + question.userAnswer)}`
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-2">Correct Answer:</p>
                              <p className="text-sm p-2 rounded bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                Option {String.fromCharCode(65 + question.correctAnswer)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                              <Brain className="h-4 w-4 inline mr-2" />
                              Explanation:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Topic Analysis Tab */}
          <TabsContent value="topic-analysis">
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>Subject-wise Performance</CardTitle>
                  <CardDescription>
                    Analyze your performance across different physics topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topicAnalysis.map((topic, index) => (
                      <div key={topic.topic} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{topic.topic}</h4>
                          <div className="text-right">
                            <p className="font-semibold">{topic.correct}/{topic.attempted}</p>
                            <p className="text-sm text-slate-500">{topic.percentage}%</p>
                          </div>
                        </div>
                        <Progress value={topic.percentage} className="h-3" />
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span>Attempted: {topic.attempted}</span>
                          <span>Correct: {topic.correct}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>Personalized Study Recommendations</CardTitle>
                  <CardDescription>
                    AI-powered suggestions to improve your performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        rec.priority === 'high' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
                        'bg-green-50 border-green-500 dark:bg-green-900/20'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            rec.type === 'improvement' ? 'bg-red-100 dark:bg-red-900/20' :
                            rec.type === 'strength' ? 'bg-green-100 dark:bg-green-900/20' :
                            'bg-yellow-100 dark:bg-yellow-900/20'
                          }`}>
                            {rec.type === 'improvement' && <Target className="h-5 w-5 text-red-600" />}
                            {rec.type === 'strength' && <Trophy className="h-5 w-5 text-green-600" />}
                            {rec.type === 'time-management' && <Clock className="h-5 w-5 text-yellow-600" />}
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{rec.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced-analytics">
            <motion.div variants={itemVariants}>
              <AdvancedAnalytics testResults={testResults} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
