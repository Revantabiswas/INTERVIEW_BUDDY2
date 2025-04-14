"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, BookOpen, FileText, BrainCircuit, FlaskConical } from "lucide-react"

export default function Home() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Test API connectivity on component mount
    testBackendConnection()
  }, [])

  const testBackendConnection = async () => {
    try {
      setBackendStatus('checking')
      setErrorMessage('')
      
      // Try to fetch documents list as a connectivity test
      await api.documents.getAll()
      
      // If we get here, the connection is working
      setBackendStatus('connected')
    } catch (error) {
      console.error("Backend connection failed:", error)
      setBackendStatus('error')
      
      // Determine appropriate error message
      if (error.message && error.message.includes('Network Error')) {
        setErrorMessage('Cannot connect to backend server. Please ensure the backend is running at ' + 
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'))
      } else {
        setErrorMessage(error.userMessage || error.message || 'Unknown connection error')
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Interview Buddy
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl">
          Your AI-powered learning companion to help you ace technical interviews
        </p>
        
        <div className="mt-6">
          {backendStatus === 'checking' && (
            <Badge variant="outline" className="animate-pulse">
              <div className="mr-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              Checking backend connection...
            </Badge>
          )}
          
          {backendStatus === 'connected' && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-4 w-4" />
              Backend connected
            </Badge>
          )}
          
          {backendStatus === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <Badge variant="destructive">
                <AlertCircle className="mr-1 h-4 w-4" />
                Backend connection failed
              </Badge>
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testBackendConnection}
                className="mt-2"
              >
                Retry Connection
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Study Materials
            </CardTitle>
            <CardDescription>Upload and manage your study documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload PDFs, DOCX, and TXT files to create personalized study materials. Our AI will process your documents so you can interact with them intelligently.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="secondary" disabled={backendStatus !== 'connected'} asChild>
              <a href="/document-upload">Upload Documents</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Smart Notes
            </CardTitle>
            <CardDescription>Generate organized study notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transform your documents into well-structured study notes. Organize complex topics into easy-to-review summaries with key concepts highlighted.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="secondary" disabled={backendStatus !== 'connected'} asChild>
              <a href="/study-notes">Generate Notes</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5" />
              AI Chat
            </CardTitle>
            <CardDescription>Chat with your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ask questions about your uploaded materials and get instant answers. Clarify concepts, dive deeper into topics, and test your understanding through conversation.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="secondary" disabled={backendStatus !== 'connected'} asChild>
              <a href="/ai-chat">Start Chatting</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FlaskConical className="mr-2 h-5 w-5" />
              DSA Practice
            </CardTitle>
            <CardDescription>Practice coding problems</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Prepare for technical interviews with our curated collection of data structures and algorithms problems. Get AI-powered hints and solution analysis.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="secondary" disabled={backendStatus !== 'connected'} asChild>
              <a href="/dsa-practice">Start Practicing</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

