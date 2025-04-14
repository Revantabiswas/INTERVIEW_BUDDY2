"use client"

import { useState, useEffect } from "react"
import { documentApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import DocumentSelector component
import { DocumentSelector } from "@/components/DocumentSelector"

export default function DocumentUpload() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const { toast } = useToast()

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const docs = await documentApi.getAllDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 5, 95))
    }, 100)

    try {
      // Upload file using the API
      const result = await documentApi.uploadDocument(selectedFile, true)

      setUploadProgress(100)

      if (result.status === "success" && result.document) {
        // Add new document to list
        await fetchDocuments() // Refresh document list
        setSelectedDocument(result.document)

        toast({
          title: "Upload Successful",
          description: `${selectedFile.name} has been uploaded and processed.`,
        })
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
      setSelectedFile(null)
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

  // Function to determine document status
  const getDocumentStatus = (doc) => {
    // You may need to modify this based on how your API represents document status
    return doc.hasOwnProperty("status") ? doc.status : "processed"
  }

  // Helper function to get file extension
  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase()
  }

  // Helper function to format file size
  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size"
    const sizeInMB = sizeInBytes / (1024 * 1024)
    return `${sizeInMB.toFixed(2)} MB`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Document Upload</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>Upload your study materials in PDF, DOCX, or TXT format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DocumentSelector Component */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Recent Documents</h3>
              <DocumentSelector
                onSelectDocument={setSelectedDocument}
                selectedDocument={selectedDocument}
                buttonText="Browse Files"
              />
            </div>

            <div className="separator text-center my-4">
              <span className="text-sm text-muted-foreground">Or drop a file below</span>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => document.getElementById("file-upload-direct").click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">
                {selectedFile ? selectedFile.name : "Drag & Drop or Click to Upload"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Supports PDF, DOCX, and TXT files up to 10MB"}
              </p>
              <input
                id="file-upload-direct"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />
              {selectedFile && !isUploading && (
                <Button onClick={handleUpload} className="w-full">
                  Upload File
                </Button>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="progress-animation" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start space-y-2">
            <h4 className="text-sm font-medium">Tips:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>Clear, well-formatted documents work best</li>
              <li>Ensure text is selectable in PDFs</li>
              <li>Larger documents may take longer to process</li>
            </ul>
          </CardFooter>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="processed">Processed</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-medium mb-1">Loading Documents</h3>
                    <p className="text-muted-foreground">Please wait...</p>
                  </div>
                ) : documents.length > 0 ? (
                  documents.map((doc) => {
                    const fileExt = getFileExtension(doc.filename || doc.name)
                    const status = getDocumentStatus(doc)
                    return (
                      <Card key={doc.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                        <div className="flex-shrink-0">{getFileIcon(fileExt)}</div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{doc.filename || doc.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(doc.file_size || doc.size)}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{doc.pages} pages</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              Uploaded on {new Date(doc.created_at || doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            {status === "processed" ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" /> Processed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="animate-pulse">
                                <Clock className="h-3 w-3 mr-1" /> Processing...
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Documents Found</h3>
                    <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="processed">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-medium mb-1">Loading Documents</h3>
                    <p className="text-muted-foreground">Please wait...</p>
                  </div>
                ) : documents.filter((doc) => getDocumentStatus(doc) === "processed").length > 0 ? (
                  documents
                    .filter((doc) => getDocumentStatus(doc) === "processed")
                    .map((doc) => {
                      const fileExt = getFileExtension(doc.filename || doc.name)
                      return (
                        <Card key={doc.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                          <div className="flex-shrink-0">{getFileIcon(fileExt)}</div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{doc.filename || doc.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(doc.file_size || doc.size)}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{doc.pages} pages</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                Uploaded on {new Date(doc.created_at || doc.uploadDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" /> Processed
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      )
                    })
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Processed Documents</h3>
                    <p className="text-muted-foreground">Your processed documents will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="processing">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-medium mb-1">Loading Documents</h3>
                    <p className="text-muted-foreground">Please wait...</p>
                  </div>
                ) : documents.filter((doc) => getDocumentStatus(doc) === "processing").length > 0 ? (
                  documents
                    .filter((doc) => getDocumentStatus(doc) === "processing")
                    .map((doc) => {
                      const fileExt = getFileExtension(doc.filename || doc.name)
                      return (
                        <Card key={doc.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                          <div className="flex-shrink-0">{getFileIcon(fileExt)}</div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{doc.filename || doc.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(doc.file_size || doc.size)}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{doc.pages} pages</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                Uploaded on {new Date(doc.created_at || doc.uploadDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <Badge variant="outline" className="animate-pulse">
                                <Clock className="h-3 w-3 mr-1" /> Processing...
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      )
                    })
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <CheckCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Processing Documents</h3>
                    <p className="text-muted-foreground">All your documents have been processed</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename || documentToDelete?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

