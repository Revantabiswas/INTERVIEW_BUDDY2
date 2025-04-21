"use client"

import { useState } from 'react'
import { documentApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export function DocumentProcessor({ selectedDocument }) {
  const [question, setQuestion] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedDocument) return

    setIsProcessing(true)
    try {
      const response = await documentApi.askQuestion(selectedDocument.id, question)
      setChatHistory(prev => [...prev, 
        { role: 'user', content: question },
        { role: 'assistant', content: response.answer }
      ])
      setQuestion('')
      
      toast({
        title: "Question Answered",
        description: "Your question has been processed successfully.",
      })
    } catch (error) {
      console.error("Error asking question:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process your question",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateContent = async (type) => {
    if (!selectedDocument) return

    setIsGenerating(true)
    try {
      let response
      switch (type) {
        case 'notes':
          response = await documentApi.generateNotes(selectedDocument.id)
          break
        case 'flashcards':
          response = await documentApi.generateFlashcards(selectedDocument.id)
          break
        case 'mindmap':
          response = await documentApi.generateMindMap(selectedDocument.id)
          break
        case 'test':
          response = await documentApi.generateTest(selectedDocument.id)
          break
        default:
          throw new Error("Invalid content type")
      }

      setGeneratedContent({
        type,
        content: response
      })

      toast({
        title: "Content Generated",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} have been generated successfully.`,
      })
    } catch (error) {
      console.error(`Error generating ${type}:`, error)
      toast({
        title: "Generation Failed",
        description: error.message || `Failed to generate ${type}`,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Chat Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Ask Questions</h3>
          </div>
          
          <div className="space-y-2">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary/10 ml-auto' 
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the document..."
              className="flex-1"
            />
            <Button
              onClick={handleAskQuestion}
              disabled={isProcessing || !question.trim()}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Generation Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generate Content</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleGenerateContent('notes')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Notes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerateContent('flashcards')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Flashcards
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerateContent('mindmap')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Mind Map
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerateContent('test')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Test
            </Button>
          </div>

          {generatedContent && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">
                {generatedContent.type.charAt(0).toUpperCase() + 
                 generatedContent.type.slice(1)}
              </h4>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(generatedContent.content, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
} 