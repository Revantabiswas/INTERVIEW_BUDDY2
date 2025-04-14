"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Clock, Trash2, Copy, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { api, getErrorMessage } from "@/lib/api"
import ReactMarkdown from 'react-markdown'
import useDocumentStore from "@/src/store/documentStore"
import Link from 'next/link'

export default function AIChat() {
  const { selectedDocument } = useDocumentStore()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChatHistory = async (document) => {
      if (!document || !document.filename) {
        setMessages([{
          role: "assistant",
          content: "Please select a document from the 'Document Upload' page to start chatting.",
          timestamp: new Date().toISOString()
        }])
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await api.chat.getHistory(document.filename)

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setMessages(response.data.map(msg => ({
            ...msg,
            timestamp: formatTimestamp(msg.timestamp)
          })))
        } else {
          setMessages([{
            role: "assistant",
            content: `Hello! I'm ready to chat about "${document.filename}". What would you like to know?`,
            timestamp: formatTimestamp(new Date().toISOString())
          }])
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error)
        setError("Failed to load chat history: " + getErrorMessage(error))
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive"
        })
        setMessages([{
          role: "assistant",
          content: "Sorry, I couldn't load the chat history for this document.",
          timestamp: formatTimestamp(new Date().toISOString())
        }])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatHistory(selectedDocument)
  }, [selectedDocument, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !selectedDocument || !selectedDocument.filename) {
      toast({
        title: "Cannot send message",
        description: "Please select a document first.",
        variant: "warning"
      })
      return
    }

    const timestamp = formatTimestamp(new Date().toISOString())

    const userMessage = {
      role: "user",
      content: input,
      timestamp: timestamp,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setInput("")

    try {
      const response = await api.chat.askQuestion(selectedDocument.filename, userMessage.content)

      if (response.data && response.data.history && Array.isArray(response.data.history)) {
        setMessages(response.data.history.map(msg => ({
          ...msg,
          timestamp: formatTimestamp(msg.timestamp)
        })))
      } else if (response.data && response.data.answer) {
        const assistantMessage = {
          role: "assistant",
          content: response.data.answer,
          timestamp: formatTimestamp(new Date().toISOString()),
          sources: response.data.sources || []
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error("Invalid response format from chat API")
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMsg = "Failed to get response: " + getErrorMessage(error)
      setError(errorMsg)

      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: formatTimestamp(new Date().toISOString())
      }])

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    if (selectedDocument && selectedDocument.filename) {
      setMessages([{
        role: "assistant",
        content: `Chat history cleared. Ask me anything about "${selectedDocument.filename}".`,
        timestamp: formatTimestamp(new Date().toISOString())
      }])
    } else {
      setMessages([{
        role: "assistant",
        content: "Please select a document from the 'Document Upload' page to start chatting.",
        timestamp: formatTimestamp(new Date().toISOString())
      }])
    }
    setError(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      description: "Copied to clipboard",
    })
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ""
    try {
      if (typeof timestamp === 'string' && /^\d{1,2}:\d{2}(:\d{2})?(\s(AM|PM))?$/i.test(timestamp)) {
        return timestamp
      }
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      console.error("Error formatting timestamp:", timestamp, e)
      return typeof timestamp === 'string' ? timestamp : "Error"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Chat Assistant</h1>

      <Card className="lg:col-span-4 h-[calc(100vh-12rem)] flex flex-col">
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">InterviewBuddy AI</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDocument 
                    ? `Chatting with: ${selectedDocument.filename}` 
                    : "Please select a document to start chatting"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && !isLoading && (
              <div className="flex justify-center">
                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} /> 
                                     : <pre className="bg-muted p-2 rounded overflow-x-auto text-sm my-2"><code {...props} /></pre>,
                            a: ({node, ...props}) => <a className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props} />,
                          }}
                        >
                          {message.content || ""}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content || ""}</div>
                      )}
                    </div>

                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <span>{formatTimestamp(message.timestamp)}</span>
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

          <div className="p-4 border-t">
            {!selectedDocument && (
              <div className="text-center text-sm text-muted-foreground mb-2">
                Please <Link href="/document-upload" className="underline text-primary">select a document</Link> to start chatting.
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedDocument 
                  ? "Ask a question about your document..." 
                  : "Select a document first"}
                className="flex-1"
                disabled={!selectedDocument || isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!selectedDocument || !input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

