"use client"

import { useState, useEffect, useRef } from 'react'
import { documentApi, chatApi } from '@/lib/api'
import { DocumentSelector } from '@/components/DocumentSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Loader2, Send, User, Bot, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import ReactMarkdown from 'react-markdown'

export default function ChatPage() {
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef(null)
  
  // Load chat history when document is selected
  useEffect(() => {
    if (selectedDocument) {
      loadChatHistory()
    } else {
      setMessages([])
    }
  }, [selectedDocument])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const loadChatHistory = async () => {
    if (!selectedDocument) return
    
    try {
      console.log(`Loading chat history for document: ${selectedDocument.id}`);
      const history = await chatApi.getChatHistory(selectedDocument.id);
      console.log("Chat history loaded:", history);
      
      if (history && history.length === 0) {
        // Add initial greeting
        setMessages([{
          role: "assistant",
          content: `Hello! I'm your study assistant. Ask me anything about "${selectedDocument.filename}".`
        }]);
      } else if (history) {
        // Convert the history format to match our UI format
        const formattedHistory = history.map(item => ({
          role: "user",
          content: item.question
        })).concat(history.map(item => ({
          role: "assistant",
          content: item.answer
        })));
        
        // Interleave user and assistant messages
        const interleavedHistory = [];
        for (let i = 0; i < history.length; i++) {
          interleavedHistory.push(formattedHistory[i]);
          interleavedHistory.push(formattedHistory[i + history.length]);
        }
        
        setMessages(interleavedHistory);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history. Starting a new conversation.",
        variant: "destructive",
      });
      
      // Start with a greeting
      setMessages([{
        role: "assistant",
        content: `Hello! I'm your study assistant. Ask me anything about "${selectedDocument.filename}".`
      }]);
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!input.trim() || !selectedDocument) return
    
    // Add user message to UI immediately
    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      console.log(`Sending question: "${input}" about document: ${selectedDocument.id}`);
      
      // Send to API
      const response = await chatApi.askQuestion(
        input,
        selectedDocument.id
      )
      
      console.log("Chat response received:", response);
      
      // Add assistant response
      if (response && response.answer) {
        setMessages(prev => [...prev, { role: "assistant", content: response.answer }])
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Add error message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again."
      }])
      
      toast({
        title: "Error",
        description: error.message || "Failed to get response from the server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const clearChat = async () => {
    if (!selectedDocument) return
    
    try {
      await chatApi.clearChatHistory(selectedDocument.id)
      setMessages([{
        role: "assistant",
        content: `Hello! I'm your study assistant. Ask me anything about "${selectedDocument.filename}".`
      }])
      
      toast({
        title: "Chat cleared",
        description: "Chat history has been cleared",
      })
    } catch (error) {
      console.error("Error clearing chat:", error)
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      })
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">AI Study Chat</h1>
      
      <div className="mb-6">
        <DocumentSelector
          onSelectDocument={setSelectedDocument}
          selectedDocument={selectedDocument}
        />
      </div>
      
      <Card className="mb-4">
        <div className="h-[500px] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              {selectedDocument 
                ? `Chatting about: ${selectedDocument.filename}`
                : 'Select a document to start chatting'}
            </h2>
            
            {selectedDocument && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                title="Clear chat history"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !selectedDocument && (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                <p>Select a document to start chatting with the AI</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <Avatar className={`${
                    msg.role === 'assistant' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {msg.role === 'assistant' ? <Bot /> : <User />}
                  </Avatar>
                  
                  <div className={`rounded-lg p-4 ${
                    msg.role === 'assistant' 
                      ? 'bg-muted' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose dark:prose-invert max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="bg-primary">
                    <Bot />
                  </Avatar>
                  <div className="rounded-lg p-4 bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form 
            onSubmit={handleSendMessage}
            className="p-4 border-t flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedDocument 
                ? "Ask about this document..." 
                : "Select a document first"}
              disabled={!selectedDocument || isLoading}
            />
            <Button 
              type="submit" 
              disabled={!selectedDocument || !input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}