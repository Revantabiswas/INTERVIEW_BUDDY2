"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Trash2, Search, Filter, Plus, FileDown, Copy } from "lucide-react"

// Mock data for study notes
const mockNotes = [
  {
    id: 1,
    title: "Data Structures Overview",
    source: "Data Structures Notes.pdf",
    createdAt: "2023-10-15",
    content: `# Data Structures Overview

## Arrays
- Contiguous memory allocation
- O(1) access time
- O(n) insertion/deletion time (worst case)

## Linked Lists
- Non-contiguous memory allocation
- O(n) access time
- O(1) insertion/deletion time (with pointer)

## Stacks
- LIFO (Last In First Out)
- Operations: push, pop, peek
- Applications: function calls, undo operations

## Queues
- FIFO (First In First Out)
- Operations: enqueue, dequeue, peek
- Applications: scheduling, BFS algorithm`,
  },
  {
    id: 2,
    title: "Sorting Algorithms",
    source: "Algorithm Cheat Sheet.docx",
    createdAt: "2023-10-12",
    content: `# Sorting Algorithms

## Bubble Sort
- Time Complexity: O(n²)
- Space Complexity: O(1)
- Stable: Yes

## Merge Sort
- Time Complexity: O(n log n)
- Space Complexity: O(n)
- Stable: Yes

## Quick Sort
- Time Complexity: O(n log n) average, O(n²) worst
- Space Complexity: O(log n)
- Stable: No

## Heap Sort
- Time Complexity: O(n log n)
- Space Complexity: O(1)
- Stable: No`,
  },
]

export default function StudyNotes() {
  const [notes, setNotes] = useState(mockNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")

  // Get unique sources for filter
  const sources = ["All", ...new Set(notes.map((note) => note.source))]

  // Filter notes based on search and filters
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "All" || note.source === sourceFilter

    return matchesSearch && matchesSource
  })

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const handleCopyNote = (content) => {
    navigator.clipboard.writeText(content)
    // You could add a toast notification here
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Study Notes Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit animate-slide-in">
          <CardHeader>
            <CardTitle>Generate Notes</CardTitle>
            <CardDescription>Create concise notes from your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button className="w-full flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Study Notes
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Filter Notes</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-6">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <Card key={note.id} className="animate-slide-in">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{note.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <FileText className="h-4 w-4 mr-1" />
                              {note.source} • {note.createdAt}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleCopyNote(note.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose dark:prose-invert max-w-none">
                          <pre className="text-sm whitespace-pre-wrap font-sans">{note.content}</pre>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex space-x-2">
                            <Badge variant="outline">Study Notes</Badge>
                            <Badge variant="outline">{note.content.split("\n").length} lines</Badge>
                          </div>
                          <Button variant="outline" className="flex items-center">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export as Markdown
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Notes Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || sourceFilter !== "All"
                        ? "No notes match your search criteria. Try adjusting your filters."
                        : "Generate your first study notes to get started."}
                    </p>
                    {searchQuery || sourceFilter !== "All" ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("")
                          setSourceFilter("All")
                        }}
                      >
                        Reset Filters
                      </Button>
                    ) : (
                      <Button>Generate Notes</Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-6">
              <div className="space-y-6">
                {filteredNotes.length > 0 ? (
                  filteredNotes
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map((note) => (
                      <Card key={note.id} className="animate-slide-in">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{note.title}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <FileText className="h-4 w-4 mr-1" />
                                {note.source} • {note.createdAt}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="icon" onClick={() => handleCopyNote(note.content)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="text-sm whitespace-pre-wrap font-sans">{note.content}</pre>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="flex justify-between items-center w-full">
                            <div className="flex space-x-2">
                              <Badge variant="outline">Study Notes</Badge>
                              <Badge variant="outline">{note.content.split("\n").length} lines</Badge>
                            </div>
                            <Button variant="outline" className="flex items-center">
                              <FileDown className="mr-2 h-4 w-4" />
                              Export as Markdown
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Recent Notes</h3>
                    <p className="text-muted-foreground mb-4">You haven't generated any notes recently.</p>
                    <Button>Generate Notes</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <div className="text-center py-12 border rounded-lg animate-fade-in">
                <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">No Favorite Notes</h3>
                <p className="text-muted-foreground mb-4">Mark notes as favorites to access them quickly.</p>
                <Button variant="outline">Browse All Notes</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

