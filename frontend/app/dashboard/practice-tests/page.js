"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Check, 
  X, 
  ClipboardList, 
  Timer,
  Loader2
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
import { useToast } from "@/components/ui/use-toast"
import { documentApi, testsApi } from "@/lib/api"
import { DocumentSelector } from "@/components/DocumentSelector"

export default function PracticeTestPage() {
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState("Medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tests, setTests] = useState([])
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState("")
  const [useDocument, setUseDocument] = useState(false)
  const [activeTest, setActiveTest] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [score, setScore] = useState(null)
  const { toast } = useToast()

  // Fetch available documents and tests on mount
  useEffect(() => {
    fetchDocuments()
    fetchTests()
  }, [])

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

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await documentApi.getAllDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch tests from API
  const fetchTests = async () => {
    try {
      setIsLoading(true)
      const fetchedTests = await testsApi.getAllTests()
      setTests(fetchedTests || [])
    } catch (error) {
      console.error("Error fetching tests:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tests",
        variant: "destructive",
      })
      setTests([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateTest = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for your test",
        variant: "destructive",
      })
      return
    }

    // Only validate document selection if useDocument is true
    if (useDocument && !selectedDocument) {
      toast({
        title: "Error",
        description: "Please select a document",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    try {
      console.log("Generating test with parameters:", {
        topic,
        documentId: useDocument ? selectedDocument : null,
        difficulty
      });
      
      // Call the API to generate a test
      const newTest = await testsApi.generateTest(
        topic, 
        useDocument ? selectedDocument : null, 
        difficulty
      );
      
      console.log("Test successfully generated:", newTest);
      
      // Add test to local state
      if (newTest && newTest.id) {
        setTests(prevTests => {
          // Check if this test is already in the array
          const exists = prevTests.some(t => t.id === newTest.id);
          if (!exists) {
            return [newTest, ...prevTests];
          }
          return prevTests;
        });
      }
      
      toast({
        title: "Success",
        description: "Practice test generated successfully"
      });
      
      setTopic("");
    } catch (error) {
      console.error("Error generating test:", error);
      
      // Provide a more specific error message
      let errorMessage = "Failed to generate test";
      if (error.message) {
        // Clean up any JSON or object notation from error message
        errorMessage = error.message.replace(/\[object Object\]/g, "Error").trim();
        // If message is empty after cleaning, use default
        if (!errorMessage) errorMessage = "Failed to generate test";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleStartTest = async (testId) => {
    try {
      setIsLoading(true)
      const testData = await testsApi.getTest(testId)
      
      setActiveTest(testId)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setTestStarted(true)
      setTestCompleted(false)
      setScore(null)

      if (testData && testData.timeLimit) {
        setTimeRemaining(testData.timeLimit * 60)
      }
    } catch (error) {
      console.error("Error starting test:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load test",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  const handleCompleteTest = async () => {
    setIsLoading(true)
    setTestStarted(false)
    
    try {
      const test = tests.find((t) => t.id === activeTest)
      if (!test) throw new Error("Test not found")
      
      // Format answers for backend submission
      const formattedAnswers = {}
      
      Object.keys(answers).forEach(questionId => {
        const question = test.questions.find(q => q.id === questionId)
        if (!question) return
        
        if (question.type === "multiple-choice") {
          const selectedIndex = answers[questionId]
          formattedAnswers[questionId] = question.options[selectedIndex] || ""
        } else {
          formattedAnswers[questionId] = answers[questionId] || ""
        }
      })
      
      console.log("Submitting answers:", formattedAnswers)
      
      // Submit test answers to backend
      const result = await testsApi.submitTestAnswers(activeTest, formattedAnswers)
      
      setTestCompleted(true)
      setScore(result.score || calculateScore())
      
      toast({
        title: "Test completed",
        description: "Your answers have been submitted",
      })
    } catch (error) {
      console.error("Error submitting test:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit test answers",
        variant: "destructive",
      })
      setTestCompleted(true)
      setScore(calculateScore())
    } finally {
      setIsLoading(false)
    }
  }
  
  const calculateScore = () => {
    const test = tests.find((t) => t.id === activeTest)
    if (!test) return 0

    let correctCount = 0
    let totalGradable = 0

    test.questions.forEach((question) => {
      if (question.type !== "essay" && question.correctAnswer !== undefined) {
        totalGradable++

        if (
          (question.type === "multiple-choice" &&
            answers[question.id] === question.correctAnswer) ||
          (question.type === "short-answer" &&
            answers[question.id]?.toLowerCase().includes(question.correctAnswer.toString().toLowerCase()))
        ) {
          correctCount++
        }
      }
    })

    return totalGradable > 0 ? (correctCount / totalGradable) * 100 : 0
  }

  const handleDeleteTest = async (testId) => {
    try {
      await testsApi.deleteTest(testId)
      setTests(prevTests => prevTests.filter(t => t.id !== testId))
      toast({
        title: "Test deleted",
        description: "The test has been removed",
      })
    } catch (error) {
      console.error("Error deleting test:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete the test",
        variant: "destructive",
      })
    }
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
    
    // Debug the question structure
    console.log("Current question:", question);
    console.log("Question type:", question.type);
    console.log("Has options:", !!question.options);
    console.log("Options array:", question.options);
    
    // Check for alternatives
    if (question.choices && !question.options) {
      console.log("Found 'choices' instead of 'options':", question.choices);
      question.options = question.choices; // Fix on the fly
    }

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
            <CardTitle className="text-lg">{question.text || question.question}</CardTitle>
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
                <div key={`question-${question.id || index}`} className="border-b pb-4 last:border-b-0">
                  <p className="font-medium">
                    Question {index + 1}: {question.text || question.question}
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="use-document"
                        checked={useDocument}
                        onChange={() => setUseDocument(!useDocument)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="use-document">Use document for context (optional)</Label>
                    </div>

                    {useDocument && (
                      <div className="space-y-2">
                        <Label htmlFor="document-selector">Select Document</Label>
                        <DocumentSelector
                          documents={documents}
                          selectedDocument={selectedDocument}
                          onSelectDocument={setSelectedDocument}
                          isLoading={isLoading}
                        />
                      </div>
                    )}

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

                    <Button 
                      onClick={handleGenerateTest} 
                      disabled={!topic.trim() || (useDocument && !selectedDocument) || isGenerating} 
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

            {isLoading && !tests.length ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tests.length > 0 ? (
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
                              <h3 className="font-semibold text-lg">{test.title || test.topic}</h3>
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
                                  {test.questions?.length || 0} questions
                                </span>
                                {test.timeLimit && (
                                  <span className="ml-3 text-sm text-muted-foreground flex items-center">
                                    <Timer className="h-3 w-3 mr-1" />
                                    {test.timeLimit} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={() => handleStartTest(test.id)}>Take Test</Button>
                              <Button variant="outline" onClick={() => handleDeleteTest(test.id)}>Delete</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Tests Found</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first practice test to get started
                </p>
              </div>
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
