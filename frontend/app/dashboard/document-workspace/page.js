"use client"

import { useState, useRef, useEffect } from "react"
import { documentApi, chatApi, notesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Upload,
  File,
  FileText,
  FileIcon as FilePdf,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Loader2,
  Send,
  Bot,
  User,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Book,
  Search,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import components
import { DocumentSelector } from "@/components/DocumentSelector"
import { Message } from "@/components/Message"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast as reactHotToast } from 'react-hot-toast'

// Initial welcome message for the chat
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your InterviewBuddy AI assistant. How can I help with your documents today?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
]

export default function DocumentWorkspace() {
  // Shared state across tabs
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  
  // Document Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  
  // Chat state
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const messagesEndRef = useRef(null)
  
  // Study Notes state
  const [notes, setNotes] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Scroll chat to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
    fetchNotes()
  }, [])

  // Fetch all documents
  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const docs = await documentApi.getAllDocuments()
      console.log("Documents fetched:", docs)
      
      if (Array.isArray(docs)) {
        setDocuments(docs)
      } else {
        console.warn("API returned unexpected format for documents", docs)
        setDocuments([])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      reactHotToast.error("Failed to load documents. Please try again later.")
      setError("Failed to fetch documents. Please try again later.")
      setDocuments([]) 
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch all notes
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
      
      // Map document IDs to filenames using the documents array
      const documentMap = {};
      documents.forEach(doc => {
        if (doc.id) {
          documentMap[doc.id] = doc.filename || "Unknown Document";
        }
      });
      
      // Transform notes to match the expected format
      const formattedNotes = fetchedNotes.map(note => ({
        id: note.id || String(Math.random()).slice(2, 10),
        title: note.topic ? `Notes on ${note.topic}` : `Study Notes`,
        content: note.content || "No content available",
        document_id: note.document_id,
        created_at: note.created_at || new Date().toISOString(),
        source: documentMap[note.document_id] || `Document ${note.document_id}`
      }));
      
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch study notes",
        variant: "destructive",
      });
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // DOCUMENT UPLOAD FUNCTIONS
  
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        reactHotToast.error('Please upload a PDF file')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      reactHotToast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setProcessing(true)
    setError(null)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 5, 95))
    }, 100)

    try {
      // Upload file using the API
      const result = await documentApi.uploadDocument(selectedFile)

      setUploadProgress(100)

      if (result && result.id) {
        // Add new document to list
        await fetchDocuments() // Refresh document list
        setSelectedDocument(result)

        reactHotToast.success('Document uploaded successfully!')
        setSelectedFile(null) // Clear file only on success
      } else {
        throw new Error("Upload failed: No document_id returned")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      setError(error.message || "Failed to upload document. Please try again.")
      reactHotToast.error(error.message || "Failed to upload document")
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
      setProcessing(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      await documentApi.deleteDocument(documentToDelete.id)

      // Update documents list
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id))

      toast({
        title: "Document Deleted",
        description: `${documentToDelete.filename || documentToDelete.name} has been deleted.`,
      })
      
      // Also update selected documents in chat
      setSelectedDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      
      // If the deleted document was selected for notes generation, clear it
      if (selectedDocument && selectedDocument.id === documentToDelete.id) {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  // Helper functions for document display
  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="h-10 w-10 text-red-500" />
      case "docx":
        return <FileText className="h-10 w-10 text-blue-500" />
      case "txt":
        return <File className="h-10 w-10 text-gray-500" />
      default:
        return <File className="h-10 w-10 text-gray-500" />
    }
  }

  const getDocumentStatus = (doc) => {
    return doc.hasOwnProperty("status") ? doc.status : "processed"
  }

  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase()
  }

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size"
    const sizeInMB = sizeInBytes / (1024 * 1024)
    return `${sizeInMB.toFixed(2)} MB`
  }

  // CHAT FUNCTIONS
  
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isChatLoading) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsChatLoading(true)

    try {
      // Format history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Get document IDs from selected documents
      const documentIds = selectedDocuments.map(doc => doc.id)

      // Call API to get response
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
      setIsChatLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: "Hello! I'm your InterviewBuddy AI assistant. How can I help with your documents today?",
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

  // STUDY NOTES FUNCTIONS
  
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Document Workspace</h1>
        <p className="text-muted-foreground text-lg">
          Upload, chat with your documents, and generate study notes in one unified workspace
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="space-y-8">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 w-full border-b pb-2">
          <TabsList className="w-full bg-muted/40 p-1 rounded-xl">
            <TabsTrigger value="upload" className="flex-1 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Upload className="h-4 w-4 mr-2" /> Upload Documents
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Bot className="h-4 w-4 mr-2" /> AI Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Book className="h-4 w-4 mr-2" /> Study Notes
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Document Upload Tab */}
        <TabsContent value="upload" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <Card className="lg:col-span-1 border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-2xl">
                  <Upload className="h-6 w-6 mr-3 text-primary" />
                  Upload Documents
                </CardTitle>
                <CardDescription className="text-md">
                  Upload your study materials in PDF format for AI processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Recently Uploaded Documents
                  </h3>
                  <DocumentSelector
                    onSelectDocument={setSelectedDocument}
                    selectedDocument={selectedDocument}
                    buttonText="Browse Files"
                    className="w-full"
                  />
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-sm text-muted-foreground">
                      Or upload a new file
                    </span>
                  </div>
                </div>

                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/40 transition-colors group"
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  <div className="mb-4 rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-7 w-7 text-primary mx-auto" />
                  </div>
                  <p className="text-xl font-medium mb-2">
                    {selectedFile ? selectedFile.name : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Supports PDF files up to 10MB"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {selectedFile && !isUploading && !processing && (
                    <Button 
                      onClick={handleUpload} 
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      Upload File
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-5 rounded-lg p-4 bg-muted">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Uploading...</span>
                      <span className="font-bold">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 progress-animation" />
                  </div>
                )}

                {processing && (
                  <div className="mt-5 rounded-lg p-4 bg-muted/50 flex items-center">
                    <Loader2 className="h-5 w-5 mr-3 animate-spin text-primary" />
                    <span className="font-medium">Processing document...</span>
                  </div>
                )}

                {error && (
                  <div className="mt-5 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-1 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start space-y-4 pt-0 border-t border-muted/40 px-6 py-4">
                <h4 className="text-sm font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                  Tips for Best Results:
                </h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                  <li>Use clear, well-formatted documents for better analysis</li>
                  <li>Ensure text is selectable in PDFs for proper extraction</li>
                  <li>Larger documents may take longer to process</li>
                </ul>
              </CardFooter>
            </Card>

            {/* Documents List */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="all" className="h-full flex flex-col">
                <div className="border-b pb-2 mb-6">
                  <TabsList className="inline-flex bg-muted/40 p-1 rounded-lg">
                    <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">All Documents</TabsTrigger>
                    <TabsTrigger value="processed" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Processed</TabsTrigger>
                    <TabsTrigger value="processing" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Processing</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="flex-1 mt-0">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-16 border rounded-xl bg-muted/10">
                        <div className="rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">Loading Your Documents</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your documents...</p>
                      </div>
                    ) : documents.length > 0 ? (
                      documents.map((doc) => {
                        const fileExt = getFileExtension(doc.filename || doc.name)
                        const status = getDocumentStatus(doc)
                        return (
                          <Card 
                            key={doc.id} 
                            className="flex flex-col md:flex-row md:items-center p-5 gap-6 border border-border/40 hover:border-border/80 hover:shadow-md transition-all"
                          >
                            <div className="flex-shrink-0 bg-muted/30 p-3 rounded-lg">{getFileIcon(fileExt)}</div>
                            <div className="flex-grow">
                              <h3 className="text-lg font-medium">{doc.filename || doc.name}</h3>
                              <div className="flex flex-wrap gap-3 mt-2">
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <File className="h-3.5 w-3.5 mr-1" />
                                  {formatFileSize(doc.file_size || doc.size)}
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  {doc.pages} pages
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {new Date(doc.created_at || doc.uploadDate).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="mt-3">
                                {status === "processed" ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-100 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Processed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="animate-pulse border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 md:mt-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-muted/50"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-muted"
                                onClick={() => handleDeleteClick(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        )
                      })
                    ) : (
                      <div className="text-center py-16 border border-dashed rounded-xl">
                        <div className="rounded-full bg-muted/30 p-5 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-3">No Documents Found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          Upload your first document to start analyzing and learning from your materials
                        </p>
                        <Button 
                          onClick={() => document.getElementById("file-upload").click()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="processed" className="flex-1 mt-0">
                  <div className="space-y-4">
                    {isLoading ? (
                      // ... similar loading state as above
                      <div className="text-center py-16 border rounded-xl bg-muted/10">
                        <div className="rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">Loading Your Documents</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your documents...</p>
                      </div>
                    ) : documents.filter((doc) => getDocumentStatus(doc) === "processed").length > 0 ? (
                      documents
                        .filter((doc) => getDocumentStatus(doc) === "processed")
                        .map((doc) => {
                          // ... similar document card as above
                          const fileExt = getFileExtension(doc.filename || doc.name)
                          return (
                            <Card 
                              key={doc.id} 
                              className="flex flex-col md:flex-row md:items-center p-5 gap-6 border border-border/40 hover:border-border/80 hover:shadow-md transition-all"
                            >
                              <div className="flex-shrink-0 bg-muted/30 p-3 rounded-lg">{getFileIcon(fileExt)}</div>
                              <div className="flex-grow">
                                <h3 className="text-lg font-medium">{doc.filename || doc.name}</h3>
                                <div className="flex flex-wrap gap-3 mt-2">
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <File className="h-3.5 w-3.5 mr-1" />
                                    {formatFileSize(doc.file_size || doc.size)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                    {doc.pages} pages
                                  </span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {new Date(doc.created_at || doc.uploadDate).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="mt-3">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-100 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Processed
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4 md:mt-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-muted/50"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-muted"
                                  onClick={() => handleDeleteClick(doc)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          )
                        })
                    ) : (
                      <div className="text-center py-16 border border-dashed rounded-xl">
                        <div className="rounded-full bg-muted/30 p-5 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No Processed Documents</h3>
                        <p className="text-muted-foreground">Your processed documents will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="processing" className="flex-1 mt-0">
                  <div className="space-y-4">
                    {isLoading ? (
                      // ... similar loading state as above
                      <div className="text-center py-16 border rounded-xl bg-muted/10">
                        <div className="rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">Loading Your Documents</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your documents...</p>
                      </div>
                    ) : documents.filter((doc) => getDocumentStatus(doc) === "processing").length > 0 ? (
                      documents
                        .filter((doc) => getDocumentStatus(doc) === "processing")
                        .map((doc) => {
                          // ... similar document card as above
                          const fileExt = getFileExtension(doc.filename || doc.name)
                          return (
                            <Card 
                              key={doc.id} 
                              className="flex flex-col md:flex-row md:items-center p-5 gap-6 border border-border/40 hover:border-border/80 hover:shadow-md transition-all"
                            >
                              <div className="flex-shrink-0 bg-muted/30 p-3 rounded-lg">{getFileIcon(fileExt)}</div>
                              <div className="flex-grow">
                                <h3 className="text-lg font-medium">{doc.filename || doc.name}</h3>
                                <div className="flex flex-wrap gap-3 mt-2">
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <File className="h-3.5 w-3.5 mr-1" />
                                    {formatFileSize(doc.file_size || doc.size)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                    {doc.pages} pages
                                  </span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {new Date(doc.created_at || doc.uploadDate).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="mt-3">
                                  <Badge variant="outline" className="animate-pulse border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4 md:mt-0">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-muted"
                                  onClick={() => handleDeleteClick(doc)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          )
                        })
                    ) : (
                      <div className="text-center py-16 border border-dashed rounded-xl">
                        <div className="rounded-full bg-muted/30 p-5 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No Processing Documents</h3>
                        <p className="text-muted-foreground">All your documents have been processed</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>
        
        {/* AI Chat Tab */}
        <TabsContent value="chat" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Document Context Sidebar */}
            <Card className="lg:col-span-1 h-[calc(100vh-12rem)] flex flex-col border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-xl flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Document Context
                </CardTitle>
                <CardDescription>
                  Select documents to use as context for your AI chat
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto py-4">
                <h3 className="font-medium mb-3 flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Available Documents
                </h3>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                    <span className="text-sm text-muted-foreground">Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No documents available. Upload documents to use them for context.
                    </p>
                    <Button 
                      className="mt-4 w-full" 
                      size="sm" 
                      variant="outline"
                      onClick={() => document.getElementById("file-upload").click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-1">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${
                          selectedDocuments.some(d => d.id === doc.id) 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleDocumentSelection(doc)}
                      >
                        <div className={`mr-2.5 h-5 w-5 flex items-center justify-center rounded-full border ${
                          selectedDocuments.some(d => d.id === doc.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-transparent"
                        }`}>
                          {selectedDocuments.some(d => d.id === doc.id) && (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className="text-sm truncate">{doc.filename}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDocuments.length > 0 && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-medium mb-2 text-primary/90">
                      Selected Documents ({selectedDocuments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocuments.map(doc => (
                        <Badge key={doc.id} variant="outline" className="bg-background text-xs flex items-center gap-1 pl-2 max-w-full">
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{doc.filename}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 ml-1 rounded-full hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc);
                            }}
                          >
                            <span className="sr-only">Remove</span>
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="font-medium mt-8 mb-3 text-sm flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                  Suggested Questions
                </h3>
                <div className="space-y-2">
                  <div 
                    className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-all border border-muted/50"
                    onClick={() => setInput("Summarize the key points from my document")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span className="text-sm">Summarize the key points</span>
                  </div>
                  <div 
                    className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-all border border-muted/50"
                    onClick={() => setInput("Explain the most important concepts in simpler terms")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span className="text-sm">Explain important concepts</span>
                  </div>
                  <div 
                    className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-all border border-muted/50"
                    onClick={() => setInput("Create practice questions from this material")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span className="text-sm">Create practice questions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-3 h-[calc(100vh-12rem)] flex flex-col shadow-lg border-none bg-gradient-to-br from-background to-muted/30">
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 border-2 border-primary/20">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">InterviewBuddy AI</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedDocuments.length > 0 
                          ? `Using ${selectedDocuments.length} document${selectedDocuments.length !== 1 ? 's' : ''} for context` 
                          : "Select documents from the sidebar to provide context"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-full hover:bg-muted h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Clear chat</span>
                    </Button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`flex-shrink-0 ${message.role === "user" ? "ml-3" : "mr-3"}`}>
                          <Avatar className={message.role === "user" ? "border-2 border-primary/20" : ""}>
                            <AvatarFallback className={message.role === "user" ? "bg-background" : "bg-primary/10 text-primary"}>
                              {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div
                            className={`rounded-2xl p-4 ${
                              message.role === "user" 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "bg-muted shadow-sm"
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>

                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-border/30 flex flex-wrap gap-2">
                                <span className="text-xs text-muted-foreground">Sources:</span>
                                {message.sources.map((source, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-background/60">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <span>{message.timestamp}</span>

                            {message.role === "assistant" && (
                              <div className="flex items-center ml-auto space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-full hover:bg-muted"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-full hover:bg-muted"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-full hover:bg-muted"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[85%]">
                        <div className="flex-shrink-0 mr-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="rounded-2xl p-4 bg-muted shadow-sm min-w-[120px]">
                            <div className="flex space-x-2">
                              <div className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"></div>
                              <div
                                className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-muted/20">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question about your documents..."
                      className="flex-1 border-muted bg-background focus-visible:ring-primary/50 shadow-sm text-[15px]"
                      disabled={isChatLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="bg-primary hover:bg-primary/90 rounded-full shadow-sm w-11 h-11"
                      disabled={isChatLoading || !input.trim()}
                    >
                      {isChatLoading ? 
                        <Loader2 className="h-5 w-5 animate-spin" /> : 
                        <Send className="h-5 w-5" />
                      }
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Study Notes Tab */}
        <TabsContent value="notes" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Generate Notes */}
            <Card className="lg:col-span-1 border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center text-2xl">
                  <Book className="h-6 w-6 mr-3 text-primary" />
                  Generate Study Notes
                </CardTitle>
                <CardDescription className="text-md">
                  Create AI-generated study notes from your documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 py-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Select Source Document
                  </label>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <DocumentSelector
                      documents={documents}
                      selectedDocument={selectedDocument}
                      onSelectDocument={setSelectedDocument}
                      isLoading={isLoading}
                      className="w-full"
                    />

                    {selectedDocument && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm font-medium mb-1">Selected Document:</p>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate">{selectedDocument.filename}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    Note Generation Options
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-summary" className="rounded border-muted-foreground/30" defaultChecked />
                      <label htmlFor="include-summary" className="text-sm">Include summary section</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-examples" className="rounded border-muted-foreground/30" defaultChecked />
                      <label htmlFor="include-examples" className="text-sm">Include examples</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-questions" className="rounded border-muted-foreground/30" defaultChecked />
                      <label htmlFor="include-questions" className="text-sm">Generate practice questions</label>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={generateNotes} 
                  disabled={isGenerating || !selectedDocument} 
                  className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                      Generating Notes...
                    </>
                  ) : (
                    <>
                      <Book className="mr-2 h-5 w-5" /> 
                      Generate Study Notes
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="rounded-lg p-4 bg-muted">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Generating notes...</span>
                    </div>
                    <Progress value={65} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">This may take a minute or two</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start space-y-4 pt-0 border-t border-muted/40 px-6 py-4">
                <h4 className="text-sm font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                  Tips for Best Results:
                </h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                  <li>Select well-structured documents with clear headings</li>
                  <li>Complex topics may generate multiple note sections</li>
                  <li>You can edit generated notes for customization</li>
                </ul>
              </CardFooter>
            </Card>
            
            {/* Right Panel - Notes List */}
            <Card className="lg:col-span-2 border-none shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center text-2xl">
                  <FileText className="h-6 w-6 mr-3 text-primary" />
                  Your Study Notes
                </CardTitle>
                <CardDescription className="text-md mb-4">
                  Review and search through your generated notes
                </CardDescription>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes content..."
                      className="pl-9 border-muted shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by document" />
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
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Loading Your Notes</h3>
                    <p className="text-muted-foreground">Please wait while we fetch your study notes...</p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center py-16 border border-dashed rounded-xl">
                    <div className="rounded-full bg-muted/30 p-5 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-3">No Study Notes Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {notes.length === 0
                        ? "Generate your first study notes to get started"
                        : "No notes match your current search criteria"}
                    </p>
                    {notes.length === 0 && (
                      <Button 
                        onClick={() => document.getElementById("file-upload").click()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document First
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredNotes.map((note) => (
                      <Card key={note.id} className="relative border border-border/50 hover:border-border/80 hover:shadow-md transition-all">
                        <CardHeader className="bg-muted/20 border-b">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">{note.title}</CardTitle>
                              <CardDescription className="mt-2 flex items-center flex-wrap gap-2">
                                <span className="flex items-center text-sm text-muted-foreground">
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  {note.source}
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Created {new Date(note.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-4">
                          <div className="max-h-96 overflow-y-auto prose prose-sm dark:prose-invert px-1 custom-scrollbar">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {note.content}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                        <div className="px-6 py-4 border-t bg-muted/10">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              className="flex gap-2 hover:bg-muted" 
                              onClick={() => {
                                navigator.clipboard.writeText(note.content);
                                toast({ title: "Copied to clipboard" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex gap-2 hover:bg-muted" 
                              onClick={() => {
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
                              }}
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              Delete Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename || documentToDelete?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              This will permanently remove the document and any associated content.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(155, 155, 155, 0.5);
        }
        .progress-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}