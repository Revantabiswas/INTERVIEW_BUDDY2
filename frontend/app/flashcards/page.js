"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  Copy,
  RefreshCw,
} from "lucide-react"

// Mock data for flashcard decks
const mockDecks = [
  {
    id: 1,
    title: "Data Structures Basics",
    source: "Data Structures Notes.pdf",
    createdAt: "2023-10-15",
    cardCount: 12,
    cards: [
      { front: "What is an array?", back: "A collection of elements stored at contiguous memory locations." },
      { front: "What is a linked list?", back: "A linear data structure where elements are not stored at contiguous locations, but connected using pointers." },
      { front: "What is a stack?", back: "A linear data structure that follows the LIFO (Last In First Out) principle." },
      { front: "What is a queue?", back: "A linear data structure that follows the FIFO (First In First Out) principle." },
      { front: "What is a tree?", back: "A hierarchical data structure with a root value and subtrees of children with a parent node." },
      { front: "What is a graph?", back: "A non-linear data structure consisting of nodes and edges." },
      { front: "What is a hash table?", back: "A data structure that implements an associative array abstract data type, a structure that can map keys to values." },
      { front: "What is a heap?", back: "A specialized tree-based data structure that satisfies the heap property." },
      { front: "What is a trie?", back: "A tree-like data structure whose nodes store the letters of an alphabet. It's used for efficient retrieval of keys in a dataset of strings." },
      { front: "What is Big O notation?", back: "A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity." },
      { front: "What is time complexity?", back: "A measure of the amount of time an algorithm takes to run as a function of the length of the input." },
      { front: "What is space complexity?", back: "A measure of the amount of memory an algorithm uses as a function of the length of the input." },
    ],
  },
  {
    id: 2,
    title: "Sorting Algorithms",
    source: "Algorithm Cheat Sheet.docx",
    createdAt: "2023-10-12",
    cardCount: 8,
    cards: [
      {
        front: "What is Bubble Sort?",
        back: "A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
      },
      {
        front: "What is Merge Sort?",
        back: "An efficient, stable, comparison-based, divide and conquer sorting algorithm.",
      },
      {
        front: "What is Quick Sort?",
        back: "An efficient, in-place sorting algorithm that uses a divide-and-conquer strategy.",
      },
      {
        front: "What is Insertion Sort?",
        back: "A simple sorting algorithm that builds the final sorted array one item at a time.",
      },
      {
        front: "What is Selection Sort?",
        back: "A simple sorting algorithm that repeatedly selects the smallest element from the unsorted portion and puts it at the beginning.",
      },
      {
        front: "What is Heap Sort?",
        back: "A comparison-based sorting algorithm that uses a binary heap data structure.",
      },
      {
        front: "What is Radix Sort?",
        back: "A non-comparative sorting algorithm that sorts data with integer keys by grouping keys by individual digits.",
      },
      {
        front: "What is Counting Sort?",
        back: "An algorithm for sorting a collection of objects according to keys that are small integers.",
      },
    ],
  },
]

export default function Flashcards() {
  const [decks, setDecks] = useState(mockDecks)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [activeTab, setActiveTab] = useState("all")
  const [currentDeck, setCurrentDeck] = useState(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Get unique sources for filter
  const sources = ["All", ...new Set(decks.map((deck) => deck.source))]

  // Filter decks based on search and filters
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch = deck.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "All" || deck.source === sourceFilter

    return matchesSearch && matchesSource
  })

  const handleDeleteDeck = (id) => {
    setDecks(decks.filter((deck) => deck.id !== id))
    if (currentDeck && currentDeck.id === id) {
      setCurrentDeck(null)
    }
  }

  const handleStudyDeck = (deck) => {
    setCurrentDeck(deck)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setActiveTab("study")
  }

  const handleNextCard = () => {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevCard = () => {
    if (currentDeck && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const handleShuffleDeck = () => {
    if (currentDeck) {
      const shuffledCards = [...currentDeck.cards].sort(() => Math.random() - 0.5)
      setCurrentDeck({
        ...currentDeck,
        cards: shuffledCards,
      })
      setCurrentCardIndex(0)
      setIsFlipped(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Flashcard Generator</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Decks</TabsTrigger>
          <TabsTrigger value="study" disabled={!currentDeck}>
            Study Mode
          </TabsTrigger>
          <TabsTrigger value="create">Create Deck</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <Card className="lg:col-span-1 h-fit animate-slide-in">
              <CardHeader>
                <CardTitle>Flashcard Decks</CardTitle>
                <CardDescription>Create and study flashcards from your documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button className="w-full flex items-center" onClick={() => setActiveTab("create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Flashcard Deck
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Filter Decks</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search decks..."
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

            {/* Decks List */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDecks.length > 0 ? (
                  filteredDecks.map((deck) => (
                    <Card key={deck.id} className="animate-slide-in">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{deck.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <BookMarked className="h-4 w-4 mr-1" />
                              {deck.source} • {deck.createdAt}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDeck(deck.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{deck.cardCount} cards</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                            onClick={() => handleStudyDeck(deck)}
                          >
                            Study Deck
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-between items-center w-full">
                          <Button variant="ghost" size="sm" className="flex items-center">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center">
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 border rounded-lg">
                    <BookMarked className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Flashcard Decks Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || sourceFilter !== "All"
                        ? "No decks match your search criteria. Try adjusting your filters."
                        : "Create your first flashcard deck to get started."}
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
                      <Button onClick={() => setActiveTab("create")}>Create Deck</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="study" className="mt-6">
          {currentDeck ? (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{currentDeck.title}</h2>
                  <p className="text-muted-foreground">
                    Card {currentCardIndex + 1} of {currentDeck.cards.length}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleShuffleDeck}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("all")}>
                    Exit Study Mode
                  </Button>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div
                  className={`w-full max-w-2xl h-64 md:h-80 perspective-1000 cursor-pointer transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                  onClick={handleFlipCard}
                >
                  <div
                    className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
                  >
                    {/* Front of card */}
                    <div
                      className={`absolute w-full h-full backface-hidden bg-card border rounded-xl p-8 flex items-center justify-center ${isFlipped ? "hidden" : ""}`}
                    >
                      <div className="text-center">
                        <h3 className="text-xl md:text-2xl font-medium mb-2">
                          {currentDeck.cards[currentCardIndex].front}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
                      </div>
                    </div>

                    {/* Back of card */}
                    <div
                      className={`absolute w-full h-full backface-hidden bg-secondary border rounded-xl p-8 flex items-center justify-center ${isFlipped ? "" : "hidden"}`}
                    >
                      <div className="text-center">
                        <h3 className="text-xl md:text-2xl font-medium mb-2">
                          {currentDeck.cards[currentCardIndex].back}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-4">Click to flip back</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center space-x-4">
                <Button variant="outline" size="icon" onClick={handlePrevCard} disabled={currentCardIndex === 0}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentCardIndex + 1} / {currentDeck.cards.length}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextCard}
                  disabled={currentCardIndex === currentDeck.cards.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <BookMarked className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No Deck Selected</h3>
              <p className="text-muted-foreground mb-4">Select a deck to start studying</p>
              <Button onClick={() => setActiveTab("all")}>Browse Decks</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <div className="text-center py-12 border rounded-lg animate-fade-in">
            <BookMarked className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-1">Create a New Flashcard Deck</h3>
            <p className="text-muted-foreground mb-4">
              Generate flashcards from your uploaded documents or create them manually
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Button>Generate from Document</Button>
              <Button variant="outline">Create Manually</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}

