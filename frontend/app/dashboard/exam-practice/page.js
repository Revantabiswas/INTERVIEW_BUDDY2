"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { examPracticeApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Download, 
  Play, 
  Plus, 
  Clock, 
  Target, 
  BookOpen, 
  Trophy, 
  Star,
  Calendar,
  Filter,
  Search,
  Settings,
  Zap,
  Brain,  
  Award,
  CheckCircle,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
  RefreshCw,
  Bookmark,
  Loader2
} from "lucide-react";

export default function ExamPractice() {
  const [mounted, setMounted] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [testDuration, setTestDuration] = useState([60]);
  const [questionCount, setQuestionCount] = useState([20]);
  const [difficulty, setDifficulty] = useState("");
  
  // Loading and error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState("");
  
  // Test taking states
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer effect for test mode
  useEffect(() => {
    if (isTestMode && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTestMode, timeRemaining]);  // API Functions
  const generateTest = async () => {
    if (!selectedSubject || !difficulty) {
      setError("Please select subject and difficulty level");
      return null;
    }

    setIsGenerating(true);
    setError("");    try {
      const test = await examPracticeApi.generateExam({
        board: selectedBoard,
        class_level: selectedClass,
        subject: selectedSubject,
        topic: selectedTopic,
        difficulty: difficulty,
        question_count: questionCount[0],
        duration: testDuration[0]
      });

      setGeneratedTest(test);
      setError("");
      return test;
    } catch (err) {
      console.error('Generate test error:', err);
      setError(err.message || 'Failed to generate test');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };  const startTest = async (testId) => {
    try {
      const attempt = await examPracticeApi.startExam(testId);
      setCurrentAttempt(attempt);
      setIsTestMode(true);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemaining(testDuration[0] * 60); // Convert minutes to seconds
      setTestStartTime(Date.now());
    } catch (err) {
      console.error('Start test error:', err);
      setError(err.message || 'Failed to start test');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };  const handleSubmitTest = async () => {
    if (!currentAttempt) return;

    try {
      const timeSpent = {};
      generatedTest.questions.forEach((q, index) => {
        timeSpent[q.id] = Math.floor((Date.now() - testStartTime) / generatedTest.questions.length / 1000);
      });      const results = await examPracticeApi.submitExamAttempt(currentAttempt.id, {
        answers: answers,
        time_spent: timeSpent,
        completed_at: new Date().toISOString(),
        skipped_questions: [],
        bookmarked_questions: []
      });

      setTestResults(results);
      setIsTestMode(false);
      setCurrentAttempt(null);
    } catch (err) {
      console.error('Submit test error:', err);
      setError(err.message || 'Failed to submit test');
    }
  };

  const handleGenerateAndStart = async () => {
    const test = await generateTest();
    if (test && test.id) {
      await startTest(test.id);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const boardOptions = [
    { value: "cbse", label: "CBSE" },
    { value: "jee", label: "JEE Main/Advanced" },
    { value: "neet", label: "NEET" },
    { value: "state", label: "State Board" }
  ];

  const classOptions = [
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" }
  ];

  const subjects = {
    "10": ["Mathematics", "Science", "Social Science", "English", "Hindi"],
    "11": ["Mathematics", "Physics", "Chemistry", "Biology", "English"],
    "12": ["Mathematics", "Physics", "Chemistry", "Biology", "English"]
  };

  const topics = {
    "Mathematics": ["Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics"],
    "Physics": ["Mechanics", "Thermodynamics", "Optics", "Electricity", "Modern Physics"],
    "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
    "Biology": ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Physiology"],
    "Science": ["Light", "Acids and Bases", "Metals and Non-metals", "Life Processes"]
  };

  const premadeTests = [
    {
      id: 1,
      title: "JEE Main Physics 2024 - Paper 1",
      type: "Previous Year",
      subject: "Physics",
      questions: 30,
      duration: 90,
      difficulty: "Hard",
      attempts: 15420,
      rating: 4.8
    },
    {
      id: 2,
      title: "CBSE Class 12 Mathematics Sample Paper",
      type: "Sample Paper",
      subject: "Mathematics", 
      questions: 25,
      duration: 180,
      difficulty: "Medium",
      attempts: 8750,
      rating: 4.6
    },
    {
      id: 3,
      title: "NEET Biology Mock Test - Genetics",
      type: "Topic Test",
      subject: "Biology",
      questions: 45,
      duration: 60,
      difficulty: "Hard",
      attempts: 12300,
      rating: 4.7
    },
    {
      id: 4,
      title: "Class 10 Science - Light and Reflection",
      type: "Chapter Test",
      subject: "Science",
      questions: 20,
      duration: 45,
      difficulty: "Easy",
      attempts: 5600,
      rating: 4.5
    }
  ];

  const recentTests = [
    {
      id: 1,
      title: "Custom Mathematics Test",
      createdAt: "2 hours ago",
      questions: 15,
      status: "draft",
      score: null
    },
    {
      id: 2,
      title: "Physics Mechanics Practice",
      createdAt: "1 day ago",
      questions: 25,
      status: "completed",
      score: 82
    },
    {
      id: 3,
      title: "Chemistry Organic Compounds",
      createdAt: "3 days ago",
      questions: 30,
      status: "in-progress",
      score: null
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

  // Test Mode UI
  if (isTestMode && generatedTest && currentAttempt) {
    const currentQuestion = generatedTest.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / generatedTest.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        {/* Test Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                    {generatedTest.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Question {currentQuestionIndex + 1} of {generatedTest.questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className={`text-lg font-mono font-bold ${
                      timeRemaining < 300 ? 'text-red-500' : 'text-green-600'
                    }`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <Button variant="outline" onClick={handleSubmitTest} className="text-sm">
                    Submit Test
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline" className="mb-2">
                    {currentQuestion.difficulty} • {currentQuestion.marks} marks
                  </Badge>
                  {currentQuestion.expected_time && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {currentQuestion.expected_time} min
                    </Badge>
                  )}
                </div>
                
                <div className="prose max-w-none dark:prose-invert mb-6">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                      const isSelected = answers[currentQuestion.id] === optionLabel;
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                          onClick={() => handleAnswerChange(currentQuestion.id, optionLabel)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {optionLabel}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300">{option}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text Answer Input */}
                {(!currentQuestion.options || currentQuestion.options.length === 0) && (
                  <div className="space-y-4">
                    <Label htmlFor="answer">Your Answer</Label>
                    <Textarea
                      id="answer"
                      placeholder="Enter your answer here..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestionIndex === generatedTest.questions.length - 1 ? (
                    <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700">
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentQuestionIndex(Math.min(generatedTest.questions.length - 1, currentQuestionIndex + 1))}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigation Panel */}
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {generatedTest.questions.map((_, index) => {
                    const isAnswered = answers[generatedTest.questions[index].id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-all duration-200 ${
                          isCurrent
                            ? 'bg-blue-500 text-white'
                            : isAnswered
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Test Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium">{Object.keys(answers).length}/{generatedTest.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-medium">{generatedTest.questions.length - Object.keys(answers).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Marks:</span>
                  <span className="font-medium">{generatedTest.total_marks}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Results Display
  if (testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <Trophy className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Test Completed!
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Great job! Here are your results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {testResults.score}%
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Final Score</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {testResults.correct_answers}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Correct Answers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.floor(testResults.time_taken / 60)}m
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Time Taken</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => {
              setTestResults(null);
              setGeneratedTest(null);
              setIsTestMode(false);
              setCurrentAttempt(null);
              setAnswers({});
            }}>
              Take Another Test
            </Button>
            <Button variant="outline">
              Review Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Test Generator & Practice
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Create custom tests or practice with curated question papers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Results
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4" />
                Quick Test
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
        <Tabs defaultValue="generator" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="gap-2">
              <Plus className="h-4 w-4" />
              Test Generator
            </TabsTrigger>
            <TabsTrigger value="premade" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Premade Tests
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              Recent Tests
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results & Analytics
            </TabsTrigger>
          </TabsList>

          {/* Test Generator Tab */}
          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Test Configuration */}
              <div className="lg:col-span-2">
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-500" />
                        Test Configuration
                      </CardTitle>
                      <CardDescription>
                        Customize your test parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Board and Class Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="board">Board/Exam</Label>
                          <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select board" />
                            </SelectTrigger>
                            <SelectContent>
                              {boardOptions.map(board => (
                                <SelectItem key={board.value} value={board.value}>
                                  {board.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="class">Class</Label>
                          <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classOptions.map(cls => (
                                <SelectItem key={cls.value} value={cls.value}>
                                  {cls.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Subject and Topic Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedClass && subjects[selectedClass]?.map(subject => (
                                <SelectItem key={subject} value={subject}>
                                  {subject}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="topic">Topic (Optional)</Label>
                          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedSubject && topics[selectedSubject]?.map(topic => (
                                <SelectItem key={topic} value={topic}>
                                  {topic}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Test Parameters */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label>Number of Questions: {questionCount[0]}</Label>
                          <Slider
                            value={questionCount}
                            onValueChange={setQuestionCount}
                            max={50}
                            min={5}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>5</span>
                            <span>50</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Duration (minutes): {testDuration[0]}</Label>
                          <Slider
                            value={testDuration}
                            onValueChange={setTestDuration}
                            max={180}
                            min={15}
                            step={15}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>15</span>
                            <span>180</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty Level</Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>                      {/* Error Display */}
                      {error && (
                        <Alert className="border-red-200 bg-red-50 text-red-800">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Generate Buttons */}
                      <div className="flex gap-4 pt-4">                        <Button 
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={async () => {
                            const test = await generateTest();
                            if (test) {
                              await startTest(test.id);
                            }
                          }}
                          disabled={isGenerating || !selectedSubject || !difficulty}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Generate & Start
                            </>
                          )}
                        </Button>
                        <Button variant="outline" className="flex-1" disabled={!generatedTest}>
                          <Download className="h-4 w-4 mr-2" />
                          Generate & Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Options */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Quick Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="h-4 w-4 mr-2" />
                        JEE Main Mock Test
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        CBSE Sample Paper
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Brain className="h-4 w-4 mr-2" />
                        NEET Practice Test
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Previous Year Questions
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-orange-500" />
                        Test Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Tests Taken</span>
                        <span className="font-semibold">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Average Score</span>
                        <span className="font-semibold">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Best Score</span>
                        <span className="font-semibold">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Time Saved</span>
                        <span className="font-semibold">2.5h</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Premade Tests Tab */}
          <TabsContent value="premade">
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Curated Test Collection</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    High-quality tests prepared by experts
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input className="pl-10 w-64" placeholder="Search tests..." />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {premadeTests.map((test) => (
                  <Card key={test.id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{test.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{test.type}</Badge>
                            <Badge variant="outline">{test.subject}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{test.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{test.questions}</p>
                          <p className="text-xs text-slate-500">Questions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{test.duration}</p>
                          <p className="text-xs text-slate-500">Minutes</p>
                        </div>
                        <div className="text-center">
                          <Badge className={`${
                            test.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {test.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {test.attempts.toLocaleString()} students attempted
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Recent Tests Tab */}
          <TabsContent value="recent">
            <motion.div variants={itemVariants}>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-purple-500" />
                    Your Recent Tests
                  </CardTitle>
                  <CardDescription>
                    Continue where you left off or review completed tests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            test.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                            test.status === 'in-progress' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                            'bg-gray-100 dark:bg-gray-900/20'
                          }`}>
                            {test.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {test.status === 'in-progress' && <Clock className="h-5 w-5 text-yellow-600" />}
                            {test.status === 'draft' && <FileText className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{test.title}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-slate-500">{test.questions} questions</span>
                              <span className="text-sm text-slate-500">{test.createdAt}</span>
                              {test.score && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Score: {test.score}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          )}
                          {test.status === 'in-progress' && (
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          )}
                          {test.status === 'draft' && (
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Results & Analytics Tab */}
          <TabsContent value="results">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Performance Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                          <p>Performance charts will be displayed here</p>
                          <p className="text-sm">Take more tests to see detailed analytics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Subject-wise Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {["Mathematics", "Physics", "Chemistry", "Biology"].map((subject, index) => {
                          const scores = [85, 78, 72, 88];
                          return (
                            <div key={subject} className="flex items-center justify-between">
                              <span className="font-medium">{subject}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                    style={{ width: `${scores[index]}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold w-12">{scores[index]}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">First Perfect Score</p>
                            <p className="text-sm text-slate-500">Scored 100% in Mathematics</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Speed Solver</p>
                            <p className="text-sm text-slate-500">Completed test in half time</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Consistent Performer</p>
                            <p className="text-sm text-slate-500">10 tests in a row</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        Study Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Focus on Chemistry
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Your weakest subject needs attention
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            Practice Time Management
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Try completing tests faster
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                            Take More Mock Tests
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            JEE Main is approaching
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}