"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  BookmarkPlus,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  Eye,
  Calculator,
  FileText,
  Lightbulb
} from "lucide-react";
import { Calculator as CalculatorComponent } from "../components/Calculator";

export default function TestInterface() {
  const [mounted, setMounted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  // Sample test data
  const testData = {
    title: "JEE Main Physics 2024 - Mock Test",
    totalQuestions: 30,
    duration: 60,
    maxMarks: 120,
    subject: "Physics"
  };

  const questions = [
    {
      id: 1,
      type: "mcq",
      marks: 4,
      negativeMarks: -1,
      question: "A particle moves in a straight line with constant acceleration. If it covers 20m in the first 2 seconds and 60m in the next 4 seconds, what is its initial velocity?",
      options: [
        "2 m/s",
        "4 m/s", 
        "6 m/s",
        "8 m/s"
      ],
      correctAnswer: 1,
      explanation: "Using equations of motion: s = ut + (1/2)at². For first 2 seconds: 20 = 2u + 2a. For next 4 seconds: 60 = 4u + 8a. Solving these equations gives u = 2 m/s.",
      difficulty: "Medium"
    },
    {
      id: 2,
      type: "mcq",
      marks: 4,
      negativeMarks: -1,
      question: "The electric field intensity at a point due to an infinite line charge is directly proportional to:",
      options: [
        "Distance from the charge",
        "Square of distance from the charge",
        "Inverse of distance from the charge",
        "Inverse square of distance from the charge"
      ],
      correctAnswer: 2,
      explanation: "For an infinite line charge, the electric field E ∝ 1/r, where r is the perpendicular distance from the line charge.",
      difficulty: "Easy"
    },
    {
      id: 3,
      type: "numerical",
      marks: 4,
      negativeMarks: 0,
      question: "A spring of spring constant 200 N/m is compressed by 10 cm. Calculate the potential energy stored in the spring (in Joules).",
      correctAnswer: 1,
      tolerance: 0.1,
      explanation: "Potential energy in spring = (1/2)kx² = (1/2) × 200 × (0.1)² = 1 J",
      difficulty: "Easy"
    }
  ];

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleBookmark = (questionId) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionStatus = (index) => {
    const questionId = questions[index].id;
    if (answers[questionId] !== undefined) {
      return markedQuestions.has(questionId) ? 'answered-marked' : 'answered';
    }
    return markedQuestions.has(questionId) ? 'marked' : 'not-visited';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-green-500';
      case 'answered-marked': return 'bg-purple-500';
      case 'marked': return 'bg-yellow-500';
      case 'current': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  if (!mounted) {
    return null;
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {testData.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Question {currentQuestion + 1} of {testData.totalQuestions} • {currentQ.marks} marks
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-red-500" />
                <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={currentQ.difficulty === 'Easy' ? 'secondary' : currentQ.difficulty === 'Medium' ? 'default' : 'destructive'}>
                      {currentQ.difficulty}
                    </Badge>
                    <Badge variant="outline">+{currentQ.marks} marks</Badge>
                    {currentQ.negativeMarks < 0 && (
                      <Badge variant="outline" className="text-red-600">
                        {currentQ.negativeMarks} marks
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBookmark(currentQ.id)}
                      className={markedQuestions.has(currentQ.id) ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalculator(!showCalculator)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed">{currentQ.question}</p>
                </div>

                {/* MCQ Options */}
                {currentQ.type === 'mcq' && (
                  <RadioGroup
                    value={answers[currentQ.id]?.toString() || ""}
                    onValueChange={(value) => handleAnswerChange(currentQ.id, parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">({String.fromCharCode(65 + index)})</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Numerical Input */}
                {currentQ.type === 'numerical' && (
                  <div className="space-y-3">
                    <Label htmlFor="numerical-answer">Enter your answer:</Label>
                    <input
                      id="numerical-answer"
                      type="number"
                      step="0.01"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, parseFloat(e.target.value))}
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                      placeholder="Enter numerical value"
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline">
                      Clear Response
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleBookmark(currentQ.id)}
                      className={markedQuestions.has(currentQ.id) ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Mark for Review
                    </Button>
                  </div>

                  <Button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === questions.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigation Panel */}
          <div className="space-y-6">
            {/* Progress */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(Object.keys(answers).length / questions.length) * 100} />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Answered</p>
                      <p className="font-semibold">{Object.keys(answers).length}/{questions.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Marked</p>
                      <p className="font-semibold">{markedQuestions.size}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Grid */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const status = index === currentQuestion ? 'current' : getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium text-white ${getStatusColor(status)} hover:opacity-80 transition-opacity`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Answered & Marked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• Click on question numbers to navigate</p>
                <p>• Use flag button to mark for review</p>
                <p>• Negative marking applies for wrong answers</p>
                <p>• Calculator available for numerical questions</p>
                <p>• Auto-submit when time ends</p>
              </CardContent>          </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Calculator Component */}
      <CalculatorComponent 
        isOpen={showCalculator} 
        onClose={() => setShowCalculator(false)} 
      />
    </div>
  );
}
