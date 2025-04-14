"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Check, 
  X, 
  ClipboardList, 
  Timer 
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { SectionContainer } from "@/components/ui/section-container"

export default function PracticeTestPage() {
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState("Medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [tests, setTests] = useState([
    {
      id: "1",
      title: "Biology Basics",
      difficulty: "Medium",
      questions: [
        {
          id: "q1",
          text: "Which organelle is known as the 'powerhouse of the cell'?",
          options: ["Nucleus", "Mitochondria", "Golgi Apparatus", "Endoplasmic Reticulum"],
          type: "multiple-choice",
          correctAnswer: 1,
        },
        {
          id: "q2",
          text: "Explain the process of photosynthesis in your own words.",
          type: "essay",
        },
        {
          id: "q3",
          text: "What is the main function of DNA?",
          type: "short-answer",
          correctAnswer: "Store genetic information",
        },
      ],
      timeLimit: 15,
    },
  ])
  const [activeTest, setActiveTest] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [score, setScore] = useState(null)

  // Timer effect for test
  useEffect(() => {
    let timer = null;
    
    if (testStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testStarted, timeRemaining]);

  const handleGenerateTest = () => {
    if (!topic.trim()) return

    setIsGenerating(true)

    // Simulate test generation
    setTimeout(() => {
      const newTest = {
        id: Date.now().toString(),
        title: topic,
        difficulty,
        questions: [
          {
            id: `q1-${Date.now()}`,
            text: `What is the main concept of ${topic}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            type: "multiple-choice",
            correctAnswer: 2,
          },
          {
            id: `q2-${Date.now()}`,
            text: `Explain the importance of ${topic} in your own words.`,
            type: "essay",
          },
          {
            id: `q3-${Date.now()}`,
            text: `Define ${topic} briefly.`,
            type: "short-answer",
            correctAnswer: `${topic} is a concept that...`,
          },
        ],
        timeLimit: difficulty === "Easy" ? 10 : difficulty === "Medium" ? 15 : 20,
      }

      setTests((prev) => [newTest, ...prev])
      setTopic("")
      setIsGenerating(false)
    }, 2000)
  }

  const handleStartTest = (testId) => {
    setActiveTest(testId)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setTestStarted(true)
    setTestCompleted(false)
    setScore(null)

    const test = tests.find((t) => t.id === testId)
    if (test && test.timeLimit) {
      setTimeRemaining(test.timeLimit * 60)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNextQuestion = () => {
    const test = tests.find((t) => t.id === activeTest)
    if (!test) return

    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      // Complete test
      handleCompleteTest()
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleCompleteTest = () => {
    setTestStarted(false)
    setTestCompleted(true)

    // Calculate score
    const test = tests.find((t) => t.id === activeTest)
    if (!test) return

    let correctCount = 0
    let totalGradable = 0

    test.questions.forEach((question) => {
      if (question.type !== "essay" && question.correctAnswer !== undefined) {
        totalGradable++

        if (
          (question.type === "multiple-choice" && answers[question.id] === question.correctAnswer) ||
          (question.type === "short-answer" &&
            answers[question.id]?.toLowerCase().includes(question.correctAnswer.toString().toLowerCase()))
        ) {
          correctCount++
        }
      }
    })

    const calculatedScore = totalGradable > 0 ? (correctCount / totalGradable) * 100 : 0
    setScore(calculatedScore)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const renderQuestion = () => {
    const test = tests.find((t) => t.id === activeTest)
    if (!test) return null

    const question = test.questions[currentQuestionIndex]

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Question {currentQuestionIndex + 1} of {test.questions.length}
          </h3>
          <Progress value={((currentQuestionIndex + 1) / test.questions.length) * 100} className="h-2" />
        </div>

        {timeRemaining > 0 && (
          <div className="mb-4 flex justify-end">
            <div className="flex items-center text-orange-500 font-medium">
              <Timer className="h-4 w-4 mr-1" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            {question.type === "multiple-choice" && question.options && (
              <RadioGroup
                value={answers[question.id] !== undefined ? answers[question.id].toString() : undefined}
                onValueChange={(value) => handleAnswerChange(question.id, Number.parseInt(value))}
              >
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "short-answer" && (
              <Input
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            )}

            {question.type === "essay" && (
              <textarea
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Write your essay answer here..."
                className="w-full h-32 p-2 border rounded-md"
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>

            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < test.questions.length - 1 ? "Next" : "Finish Test"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const renderTestResults = () => {
    const test = tests.find((t) => t.id === activeTest)
    if (!test) return null

    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Test Results: {test.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {score !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Your Score</h3>
                <div className="flex items-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className="text-primary stroke-current"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(score)}%</span>
                    </div>
                  </div>

                  <div className="ml-6">
                    {score >= 80 ? (
                      <div className="text-green-500 flex items-center">
                        <Check className="mr-2 h-5 w-5" />
                        Excellent work!
                      </div>
                    ) : score >= 60 ? (
                      <div className="text-amber-500 flex items-center">
                        <Check className="mr-2 h-5 w-5" />
                        Good job!
                      </div>
                    ) : (
                      <div className="text-red-500 flex items-center">
                        <X className="mr-2 h-5 w-5" />
                        Needs improvement
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">Answer Key</h3>
            <div className="space-y-4">
              {test.questions.map((question, index) => (
                <div key={question.id} className="border-b pb-4 last:border-b-0">
                  <p className="font-medium">
                    Question {index + 1}: {question.text}
                  </p>

                  {question.type === "multiple-choice" && question.options && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Your answer:{" "}
                        {answers[question.id] !== undefined ? question.options[answers[question.id]] : "Not answered"}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        Correct answer:{" "}
                        {question.correctAnswer !== undefined
                          ? question.options[question.correctAnswer]
                          : "N/A"}
                      </p>
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Your answer: {answers[question.id] || "Not answered"}
                      </p>
                      <p className="text-sm font-medium mt-1">Correct answer: {question.correctAnswer}</p>
                    </div>
                  )}

                  {question.type === "essay" && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Your answer:</p>
                      <p className="text-sm mt-1 p-2 bg-muted rounded-md">{answers[question.id] || "Not answered"}</p>
                      <p className="text-sm font-medium mt-2">Essay questions are manually graded.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setActiveTest(null)}>
              Back to Tests
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <SectionContainer
      icon={<ClipboardList className="h-6 w-6" />}
      title="Test Generator"
      description="Create and take practice tests to evaluate your knowledge"
      className="bg-gradient-to-b from-muted/50 to-background"
    >
      <div className="w-full max-w-3xl mx-auto">
        {!activeTest ? (
          <>
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-topic">Test Topic</Label>
                      <Input
                        id="test-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic for your test (e.g., World War II)"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="test-difficulty">Difficulty</Label>
                      <Select
                        value={difficulty}
                        onValueChange={(value) => setDifficulty(value)}
                      >
                        <SelectTrigger id="test-difficulty" className="mt-1">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleGenerateTest} disabled={!topic.trim() || isGenerating} className="w-full">
                      {isGenerating ? (
                        <>
                          <motion.div className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-primary-foreground animate-spin" />
                          Generating Test...
                        </>
                      ) : (
                        "Generate Test"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {tests.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 className="text-lg font-semibold mb-4">Your Practice Tests</h3>

                <div className="grid gap-4">
                  {tests.map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{test.title}</h3>
                              <div className="flex items-center mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    test.difficulty === "Easy"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : test.difficulty === "Medium"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  }`}
                                >
                                  {test.difficulty}
                                </span>
                                <span className="ml-3 text-sm text-muted-foreground">
                                  {test.questions.length} questions
                                </span>
                                {test.timeLimit && (
                                  <span className="ml-3 text-sm text-muted-foreground flex items-center">
                                    <Timer className="h-3 w-3 mr-1" />
                                    {test.timeLimit} min
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button onClick={() => handleStartTest(test.id)}>Take Test</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {testStarted ? (
              renderQuestion()
            ) : testCompleted ? (
              renderTestResults()
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{tests.find((t) => t.id === activeTest)?.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      You are about to start a test with {tests.find((t) => t.id === activeTest)?.questions.length}{" "}
                      questions.
                    </p>

                    {tests.find((t) => t.id === activeTest)?.timeLimit && (
                      <div className="flex items-center">
                        <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>Time limit: {tests.find((t) => t.id === activeTest)?.timeLimit} minutes</span>
                      </div>
                    )}

                    <p className="text-muted-foreground">Click "Start Test" when you're ready to begin.</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTest(null)}>
                    Back to Tests
                  </Button>
                  <Button onClick={() => setTestStarted(true)}>Start Test</Button>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </SectionContainer>
  )
}
