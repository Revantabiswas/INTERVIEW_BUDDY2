import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const GeneratedContent = ({ content, type }) => {
  const renderNotes = () => (
    <div className="space-y-4">
      {content.sections?.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {section.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderFlashcards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {content.cards?.map((card, index) => (
        <Card key={index} className="h-[200px]">
          <CardContent className="p-4">
            <div className="text-lg font-semibold mb-2">Question:</div>
            <div className="mb-4">{card.question}</div>
            <div className="text-lg font-semibold mb-2">Answer:</div>
            <div>{card.answer}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderMindMap = () => (
    <div className="w-full h-[600px] border rounded-lg p-4">
      <img 
        src={`data:image/png;base64,${content.image}`} 
        alt="Mind Map" 
        className="w-full h-full object-contain"
      />
    </div>
  )

  const renderTest = () => (
    <div className="space-y-6">
      {content.questions?.map((question, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Question {index + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">{question.text}</div>
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    id={`option-${index}-${optIndex}`}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`option-${index}-${optIndex}`}>{option}</label>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Correct Answer: {question.correct_answer}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="w-full">
      <Tabs defaultValue={type} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>
        <TabsContent value="notes">{renderNotes()}</TabsContent>
        <TabsContent value="flashcards">{renderFlashcards()}</TabsContent>
        <TabsContent value="mindmap">{renderMindMap()}</TabsContent>
        <TabsContent value="test">{renderTest()}</TabsContent>
      </Tabs>
    </div>
  )
}

export default GeneratedContent 