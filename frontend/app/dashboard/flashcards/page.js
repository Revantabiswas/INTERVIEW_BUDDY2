"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Loader2
} from "lucide-react"
import { documentApi, flashcardsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function Flashcards() {
  const [decks, setDecks] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentDeck, setCurrentDeck] = useState(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const { toast } = useToast()

  // Fetch available documents and flashcard decks on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load documents
        const docs = await fetchDocuments();
        
        // Then load flashcards with document data available
        if (docs && docs.length > 0) {
          await fetchFlashcards(docs);
        }
      } catch (error) {
        console.error("Error during initial data load:", error);
      }
    };
    
    loadData();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentApi.getAllDocuments();
      console.log("Documents loaded:", docs);
      setDocuments(docs);
      return docs;
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load documents",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  const fetchFlashcards = async (docs) => {
    try {
      setIsLoading(true);
      const fetchedDecks = await flashcardsApi.getAllFlashcards();
      console.log("Raw flashcard decks from API:", fetchedDecks);
      
      if (Array.isArray(fetchedDecks)) {
        // Use provided docs or current documents state
        const availableDocs = docs || documents;
        
        // Map the backend format to frontend format if needed
        const formattedDecks = fetchedDecks.map(deck => {
          // Extract cards from either field
          const cardsList = deck.cards || [];
          console.log(`Deck ${deck.id} has ${cardsList.length} cards`);
          
          return {
            id: deck.id,
            title: deck.topic,
            source: availableDocs.find(d => d.id === deck.document_id)?.filename || "Unknown",
            createdAt: deck.created_at,
            cards: cardsList
          };
        });
        
        console.log("Formatted decks for frontend:", formattedDecks);
        setDecks(formattedDecks);
      } else {
        console.warn("Unexpected response format from flashcards API:", fetchedDecks);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to load your flashcard decks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const generateFlashcards = async () => {
    if (!selectedDocument) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      console.log("Generating flashcards with parameters:", {
        topic: searchQuery || "full document content",
        documentId: selectedDocument,
        numCards: 10
      });
      
      const response = await flashcardsApi.generateFlashcards(
        searchQuery || "full document content", // topic
        selectedDocument, // document_id
        10 // num_cards (default)
      )
      
      console.log("Raw generate flashcards response:", response);
      
      // Enhanced processing with better error handling
      if (!response) {
        throw new Error("No data received from the server");
      }
      
      // Extract cards with improved validation
      const cardsList = response.cards || response.flashcards || [];
      console.log(`Received ${cardsList.length} cards from API`);
      
      // Process each card to ensure consistent format
      const processedCards = cardsList.map(card => {
        try {
          // If card is a string (possibly JSON string from LLM)
          if (typeof card === 'string') {
            try {
              // Try to parse it as JSON
              const parsedCard = JSON.parse(card);
              return {
                front: parsedCard.front || parsedCard.question || parsedCard.term || "Question not available",
                back: parsedCard.back || parsedCard.answer || parsedCard.definition || "Answer not available"
              };
            } catch (e) {
              // If parsing fails, use the string as front
              return { front: card, back: "No answer available" };
            }
          } 
          // If card is already an object
          else if (typeof card === 'object' && card !== null) {
            // Safety check for format strings (e.g., %s) to prevent errors
            let frontContent = card.front || card.question || card.term || "Question not available";
            let backContent = card.back || card.answer || card.definition || "Answer not available";
            
            // Make sure we handle both string and non-string cases
            frontContent = String(frontContent).replace(/%/g, '%%');
            backContent = String(backContent).replace(/%/g, '%%');
            
            return {
              front: frontContent,
              back: backContent
            };
          }
          // Fallback for any other unexpected format
          else {
            return { front: "Invalid card format", back: "Invalid card format" };
          }
        } catch (cardProcessingError) {
          console.error("Error processing card:", cardProcessingError, card);
          return { front: "Error processing card", back: "Please try regenerating" };
        }
      });
      
      // Create a properly formatted deck
      const processedDeck = {
        id: response.id || Date.now().toString(),
        title: searchQuery || "Document Flashcards",
        source: documents.find(d => d.id === selectedDocument)?.filename || "Unknown",
        createdAt: response.created_at || new Date().toISOString(),
        cards: processedCards
      };
      
      // Validation and user feedback
      if (processedCards.length === 0) {
        toast({
          title: "Warning",
          description: "No flashcards were generated. Please try again with a different topic.",
          variant: "warning",
        });
        setIsGenerating(false);
        return;
      }
      
      // Add the new deck to state
      setDecks(prev => {
        const updatedDecks = [...prev, processedDeck];
        console.log("Updated decks state:", updatedDecks);
        return updatedDecks;
      });
      
      // After generation, immediately set this deck as the current deck
      setCurrentDeck(processedDeck);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      
      toast({
        title: "Success",
        description: `Generated ${processedCards.length} flashcards successfully!`,
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try a different topic or document.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Get unique sources for filter
  const sources = ["All", ...new Set(decks.map((deck) => deck.source))]

  // Filter decks based on search and filters
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "All" || deck.source === sourceFilter
    return matchesSearch && matchesSource
  })

  const handleDeleteDeck = async (id) => {
    try {
      await flashcardsApi.deleteFlashcardDeck(id)
      
      setDecks(decks.filter((deck) => deck.id !== id))
      if (currentDeck?.id === id) {
        setCurrentDeck(null)
        setCurrentCardIndex(0)
      }
      
      toast({
        title: "Success",
        description: "Flashcard deck deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting flashcard deck:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete flashcard deck",
        variant: "destructive",
      })
    }
  }

  const handleStudyDeck = (deck) => {
    setCurrentDeck(deck)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const handleNextCard = () => {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevCard = () => {
    if (currentDeck && currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  const handleFlipCard = () => {
    setIsFlipped(prev => !prev)
  }

  const handleShuffleDeck = () => {
    if (currentDeck) {
      const shuffledCards = [...currentDeck.cards].sort(() => Math.random() - 0.5)
      setCurrentDeck({
        ...currentDeck,
        cards: shuffledCards
      })
      setCurrentCardIndex(0)
      setIsFlipped(false)
      toast({
        title: "Success",
        description: "Cards shuffled successfully",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Flashcard Generator</h1>

      <Tabs value="all">
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
                <CardTitle>Generate Flashcards</CardTitle>
                <CardDescription>Create flashcards from your documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Document</Label>
                  <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a document" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Topic or search query..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={generateFlashcards}
                  disabled={isGenerating || !selectedDocument}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Filter Decks</h3>
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
              </CardContent>
            </Card>

            {/* Decks List */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </CardContent>
                </Card>
              ) : currentDeck ? (
                <div className="space-y-6">
                  {/* Study Interface */}
                  <Card className="relative">
                    <CardHeader className="text-center">
                      <CardTitle>{currentDeck.title}</CardTitle>
                      <CardDescription>
                        Card {currentCardIndex + 1} of {currentDeck.cards.length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                      <div
                        className="w-full h-full flex items-center justify-center p-6 cursor-pointer perspective-1000"
                        onClick={handleFlipCard}
                      >
                        <div 
                          className={`w-full h-full relative transform-style-3d transition-transform duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                        >
                          {/* Front of card */}
                          <div className="absolute w-full h-full backface-hidden rounded-lg border bg-card p-6 flex items-center justify-center">
                            <div className="text-lg text-center max-w-full overflow-auto">
                              {currentDeck.cards && currentDeck.cards[currentCardIndex] && currentDeck.cards[currentCardIndex].front 
                                ? currentDeck.cards[currentCardIndex].front 
                                : "No card content available"}
                            </div>
                          </div>
                          
                          {/* Back of card */}
                          <div className="absolute w-full h-full backface-hidden rounded-lg border bg-accent p-6 rotate-y-180 flex items-center justify-center">
                            <div className="text-lg text-center max-w-full overflow-auto">
                              {currentDeck.cards && currentDeck.cards[currentCardIndex] && currentDeck.cards[currentCardIndex].back
                                ? currentDeck.cards[currentCardIndex].back
                                : "No card content available"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevCard}
                        disabled={currentCardIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleShuffleDeck}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Shuffle
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentDeck(null)}>
                          Exit
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleNextCard}
                        disabled={currentCardIndex === currentDeck.cards.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredDecks.length > 0 ? (
                    filteredDecks.map((deck) => (
                      <Card key={deck.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{deck.title}</CardTitle>
                              <CardDescription>
                                From {deck.source} • {new Date(deck.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDeck(deck.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">{deck.cards.length} cards</Badge>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" onClick={() => handleStudyDeck(deck)}>
                            Study Now
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No flashcard decks found</p>
                        <p className="text-sm text-muted-foreground">
                          Select a document and generate your first flashcard deck
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
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
                  <Button variant="outline" size="sm" onClick={() => setCurrentDeck(null)}>
                    Exit Study Mode
                  </Button>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div
                  className="w-full max-w-2xl h-64 md:h-80 perspective-1000 cursor-pointer"
                  onClick={handleFlipCard}
                >
                  <div
                    className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                  >
                    {/* Front of card */}
                    <div className="absolute w-full h-full backface-hidden bg-card border rounded-xl p-8 flex items-center justify-center">
                      <div className="text-center max-w-full overflow-auto">
                        <h3 className="text-xl md:text-2xl font-medium mb-2">
                          {currentDeck.cards && currentDeck.cards[currentCardIndex] && currentDeck.cards[currentCardIndex].front 
                            ? currentDeck.cards[currentCardIndex].front 
                            : "No card content available"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
                      </div>
                    </div>

                    {/* Back of card */}
                    <div className="absolute w-full h-full backface-hidden bg-accent border rounded-xl p-8 flex items-center justify-center rotate-y-180">
                      <div className="text-center max-w-full overflow-auto">
                        <h3 className="text-xl md:text-2xl font-medium mb-2">
                          {currentDeck.cards && currentDeck.cards[currentCardIndex] && currentDeck.cards[currentCardIndex].back
                            ? currentDeck.cards[currentCardIndex].back
                            : "No card content available"}
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
              <Button onClick={() => setCurrentDeck(null)}>Browse Decks</Button>
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
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        /* Additional styles for smoother card flipping experience */
        .card-container {
          transition: transform 0.6s;
          transform-style: preserve-3d;
          position: relative;
          width: 100%;
          height: 100%;
        }

        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden; /* Safari */
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
        }
        
        .card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}

