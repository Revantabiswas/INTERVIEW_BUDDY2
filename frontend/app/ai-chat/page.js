"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Send,
  Bot,
  User,
  Clock,
  FileText,
  Lightbulb,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import DocumentSelector component
import { DocumentSelector } from "@/components/DocumentSelector"
import { documentApi, chatApi } from "@/lib/api"
import { Message } from "@/components/Message"
import { LoadingSpinner } from "@/components/LoadingSpinner"

// Initial welcome message
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your InterviewBuddy AI assistant. How can I help with your interview preparation today?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
]

export default function AIChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoadingDocuments(true)
        const docs = await chatApi.getDocuments()
        setDocuments(docs)
      } catch (error) {
        console.error("Error loading documents:", error)
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDocuments(false)
      }
    }

    loadDocuments()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Format history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Get document IDs from selected documents
      const documentIds = selectedDocuments.map(doc => doc.id)

      // Call API to get response - using chatApi.askQuestion even for general questions
      const response = await chatApi.askQuestion(input, history, documentIds)
      
      // Add AI response to messages
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: response.sources || []
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  const toggleDocumentSelection = (document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(doc => doc.id === document.id)
      if (isSelected) {
        return prev.filter(doc => doc.id !== document.id)
      } else {
        return [...prev, document]
      }
    })
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
              
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No documents available. Upload documents to use them for context.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedDocuments.some(d => d.id === doc.id) 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => toggleDocumentSelection(doc)}
                    >
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">{doc.filename}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-2 bg-primary/5 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">
                    Using {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} for context
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocuments.map(doc => (
                      <Badge key={doc.id} variant="outline" className="text-xs">
                        {doc.filename}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="font-medium mt-6 mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                <div 
                  className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer"
                  onClick={() => setInput("Explain merge sort vs quick sort")}
                >
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm">Explain merge sort vs quick sort</span>
                </div>
                <div 
                  className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer"
                  onClick={() => setInput("What is dynamic programming?")}
                >
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm">What is dynamic programming?</span>
                </div>
                <div 
                  className="flex items-center p-2 rounded-md hover:bg-secondary cursor-pointer"
                  onClick={() => setInput("Explain hash table collisions")}
                >
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
                  <p className="text-xs text-muted-foreground">
                    {selectedDocuments.length > 0 
                      ? `Using ${selectedDocuments.length} document${selectedDocuments.length !== 1 ? 's' : ''} for context` 
                      : "Select documents to use as context"}
                  </p>
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

                        {message.sources && message.sources.length > 0 && (
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(message.content)}
                            >
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

              {isLoading && (
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
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

