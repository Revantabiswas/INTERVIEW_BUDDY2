"use client"

import { useState, useEffect } from "react"
import { documentApi, notesApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { DocumentSelector } from "@/components/DocumentSelector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Book, Search, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function StudyNotes() {
  const [notes, setNotes] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Fetch available documents and notes on mount
  useEffect(() => {
    fetchDocuments()
    fetchNotes()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await documentApi.getAllDocuments()
      setDocuments(docs)
      console.log("Available documents:", docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // New function to fetch existing notes
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await notesApi.getAllNotes();
      console.log("Fetched notes:", fetchedNotes);
      
      if (!Array.isArray(fetchedNotes) || fetchedNotes.length === 0) {
        console.log("No notes found or invalid response");
        setNotes([]);
        return;
      }
      
      // First ensure we have document information
      if (documents.length === 0) {
        await fetchDocuments();
      }
      
      // Map document IDs to filenames using the documents array
      const documentMap = {};
      documents.forEach(doc => {
        if (doc.id) {
          documentMap[doc.id] = doc.filename || "Unknown Document";
        }
      });
      
      console.log("Document mapping:", documentMap);
      
      // Transform notes to match the expected format
      const formattedNotes = fetchedNotes.map(note => ({
        id: note.id || String(Math.random()).slice(2, 10),
        title: note.topic ? `Notes on ${note.topic}` : `Study Notes`,
        content: note.content || "No content available",
        document_id: note.document_id,
        created_at: note.created_at || new Date().toISOString(),
        // Use the document map or fallback to the raw ID if no match
        source: documentMap[note.document_id] || `Document ${note.document_id}`
      }));
      
      console.log("Formatted notes:", formattedNotes);
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch study notes",
        variant: "destructive",
      });
      // Set empty array on error
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update generateNotes function to refetch notes after generation instead of manually adding to state
  const generateNotes = async () => {
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
      
      // Use the dedicated notes API
      const notesTopic = "comprehensive study notes"
      await notesApi.generateNotes(notesTopic, selectedDocument)
      
      toast({
        title: "Success",
        description: "Study notes generated successfully",
      })
      
      // Refetch notes to get the newly generated note from the backend
      await fetchNotes()
    } catch (error) {
      console.error("Error generating notes:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate study notes",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Delete note function using the API
  const deleteNote = async (noteId) => {
    try {
      await notesApi.deleteNote(noteId)
      setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId))
      toast({
        title: "Note deleted",
        description: "Study note has been removed",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete the note",
        variant: "destructive",
      })
    }
  }
  
  // Filter notes based on search query and source filter
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "All" || note.source === sourceFilter
    return matchesSearch && matchesSource
  })

  // Get unique source options for the filter dropdown
  const sourceOptions = ["All", ...new Set(notes.map(note => note.source))]

  // Update document sources for notes when documents change
  useEffect(() => {
    if (documents.length > 0 && notes.length > 0) {
      const updatedNotes = notes.map(note => ({
        ...note,
        source: documents.find(d => d.id === note.document_id)?.filename || note.source || "Unknown Document"
      }))
      setNotes(updatedNotes)
    }
  }, [documents])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Study Notes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Generate Notes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Study Notes</CardTitle>
            <CardDescription>
              Create AI-generated study notes from your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Document</label>
              <DocumentSelector
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={setSelectedDocument}
                isLoading={isLoading}
              />
            </div>
            
            <Button 
              onClick={generateNotes} 
              disabled={isGenerating || !selectedDocument} 
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Generating Notes...
                </>
              ) : (
                <>
                  <Book className="mr-2 h-4 w-4" /> 
                  Generate Study Notes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Right Panel - Notes List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Study Notes</CardTitle>
            <CardDescription>
              Review and search through your generated notes
            </CardDescription>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Study Notes Found</h3>
                <p className="text-muted-foreground mb-4">
                  {notes.length === 0
                    ? "Generate your first study notes to get started"
                    : "No notes match your current search criteria"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="relative">
                    <CardHeader>
                      <CardTitle>{note.title}</CardTitle>
                      <CardDescription>
                        Source: {note.source} | Created: {new Date(note.created_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-y-auto prose prose-sm dark:prose-invert">
                        {/* Replace simple paragraph rendering with ReactMarkdown */}
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                        >
                          {note.content}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(note.content);
                        toast({ title: "Copied to clipboard" });
                      }}>
                        Copy
                      </Button>
                      <Button variant="outline" onClick={() => {
                        // Download as markdown file
                        const blob = new Blob([note.content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${note.title.replace(/\s+/g, '_')}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}>
                        Download
                      </Button>
                      <Button variant="destructive" onClick={() => deleteNote(note.id)}>
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

