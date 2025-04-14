"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Clock, FileText, Lightbulb, Trash2, Copy, ThumbsUp, ThumbsDown } from "lucide-react"

// Mock chat history
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your InterviewBuddy AI assistant. How can I help with your interview preparation today?",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    role: "user",
    content: "Can you explain time complexity in Big O notation?",
    timestamp: "10:31 AM",
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Big O notation is used to describe the performance or complexity of an algorithm. It specifically describes the worst-case scenario and can be used to describe the execution time required or the space used by an algorithm.\n\nHere are the common Big O notations:\n\n- O(1): Constant time complexity. The algorithm takes the same amount of time regardless of input size.\n- O(log n): Logarithmic time complexity. The algorithm's time increases logarithmically as input size grows.\n- O(n): Linear time complexity. The algorithm's time increases linearly with input size.\n- O(n log n): Linearithmic time complexity. Common in efficient sorting algorithms like merge sort.\n- O(n²): Quadratic time complexity. Often seen in algorithms with nested loops.\n- O(2^n): Exponential time complexity. The algorithm's time doubles with each addition to the input.\n\nWould you like me to provide examples of algorithms for each of these time complexities?",
    timestamp: "10:32 AM",
    sources: ["Data Structures Notes.pdf", "Algorithm Cheat Sheet.docx"],
  },
]

export default function AIChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content:
          "I'm simulating an AI response to your question about: " +
          input +
          "\n\nThis is where the actual AI-generated content would appear based on your uploaded documents and the context of your conversation.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: ["Data Structures Notes.pdf"],
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: "Hello! I'm your InterviewBuddy AI assistant. How can I help with your interview preparation today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Chat Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Context Sidebar */}
        <Card className="lg:col-span-1 h-[calc(100vh-12rem)] flex flex-col">
          <Tabs defaultValue="documents">
            <TabsList className="w-full">
              <TabsTrigger value="documents" className="flex-1">
                Documents
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="flex-1 overflow-auto p-4">
              <h3 className="font-medium mb-3">Available Documents</h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Data Structures Notes.pdf</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Algorithm Cheat Sheet.docx</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">System Design Interview.txt</span>
                </div>
              </div>

              <h3 className="font-medium mt-6 mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm">Explain merge sort vs quick sort</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm">What is dynamic programming?</span>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm">Explain hash table collisions</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto p-4">
              <h3 className="font-medium mb-3">Recent Conversations</h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded-md bg-secondary cursor-pointer">
                  <Clock className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">DSA Concepts</p>
                    <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <Clock className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System Design Basics</p>
                    <p className="text-xs text-muted-foreground">Yesterday, 3:45 PM</p>
                  </div>
                </div>
                <div className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer">
                  <Clock className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">JavaScript Interview Prep</p>
                    <p className="text-xs text-muted-foreground">Oct 10, 2023</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3 h-[calc(100vh-12rem)] flex flex-col">
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">InterviewBuddy AI</h3>
                  <p className="text-xs text-muted-foreground">Powered by your study materials</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex-shrink-0 ${message.role === "user" ? "ml-3" : "mr-3"}`}>
                      <Avatar>
                        <AvatarFallback>
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>

                        {message.sources && (
                          <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">Sources:</span>
                            {message.sources.map((source, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {source}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span>{message.timestamp}</span>

                        {message.role === "assistant" && (
                          <div className="flex items-center ml-auto space-x-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%]">
                    <div className="flex-shrink-0 mr-3">
                      <Avatar>
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="rounded-lg p-3 bg-secondary">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your study materials..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

