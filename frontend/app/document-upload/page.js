"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  File,
  FileText,
  FileIcon as FilePdf,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { api, getErrorMessage, isDocumentReadyForChat } from "@/lib/api"
import useDocumentStore from "@/src/store/documentStore"

export default function DocumentUpload() {
  const {
    documents,
    selectedDocument,
    loading: storeLoading,
    error: storeError,
    setDocuments,
    setSelectedDocument,
    setLoading: setStoreLoading,
    setError: setStoreError,
  } = useDocumentStore()

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setStoreLoading(true)
      setStoreError(null)
      const response = await api.documents.getAll()
      console.log("API Response from GET /api/documents:", response)

      let rawData = response.data
      console.log("Raw data received:", rawData)

      let docs = Array.isArray(rawData)
        ? rawData
        : rawData && typeof rawData === "object" && Array.isArray(Object.values(rawData))
        ? Object.values(rawData)
        : []
      console.log("Data interpreted as array:", docs)

      docs = docs.map((doc) => ({
        ...doc,
        id: doc.id || doc.filename,
      }))
      console.log("Documents after adding ID:", docs)

      setDocuments(docs)
      console.log("Called setDocuments with:", docs)
    } catch (err) {
      const errorMsg = "Failed to load documents: " + getErrorMessage(err)
      setStoreError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      console.error("Error in fetchDocuments:", err)
    } finally {
      setStoreLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file first")
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const response = await api.documents.upload(
        selectedFile,
        (percent) => {
          setUploadProgress(percent >= 0 ? percent : Math.min(uploadProgress + 5, 95))
        },
        (errorMessage) => {
          setUploadError(errorMessage)
          toast({
            title: "Upload Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      )

      setUploadProgress(100)

      await fetchDocuments()

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })

      setSelectedFile(null)
      if (document.getElementById("file-upload")) {
        document.getElementById("file-upload").value = ""
      }
    } catch (err) {
      if (!uploadError) {
        const errorMessage = getErrorMessage(err)
        setUploadError(errorMessage)
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
      console.warn("Document upload failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectDocument = (doc) => {
    const docToSelect = {
      ...doc,
      id: doc.id || doc.filename,
    }
    setSelectedDocument(docToSelect)

    toast({
      title: "Document Selected",
      description: `${docToSelect.filename} is now the active document`,
    })
  }

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      setStoreLoading(true)

      const docIdentifier = documentToDelete.filename || documentToDelete.id
      if (!docIdentifier) {
        throw new Error("Document identifier (filename) is missing.")
      }
      await api.documents.delete(docIdentifier)

      setDocuments(
        documents.filter((doc) => (doc.filename || doc.id) !== docIdentifier)
      )

      if (selectedDocument && (selectedDocument.filename || selectedDocument.id) === docIdentifier) {
        setSelectedDocument(null)
      }

      setDeleteDialogOpen(false)
      setDocumentToDelete(null)

      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (err) {
      const errorMsg = "Failed to delete document: " + getErrorMessage(err)
      setStoreError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setStoreLoading(false)
    }
  }

  const getFileIcon = (type) => {
    if (!type && typeof documentToDelete?.filename === "string") {
      const extension = documentToDelete.filename.split(".").pop().toLowerCase()
      type = extension
    }

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
    if (doc.status) return doc.status

    return doc.pages && doc.pages > 0 ? "processed" : "processing"
  }

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size"
    const sizeInMB = sizeInBytes / (1024 * 1024)
    return `${sizeInMB.toFixed(1)} MB`
  }

  const getDocumentDate = (doc) => {
    const dateStr =
      doc.upload_time || doc.upload_date || doc.uploadDate || doc.created_at
    if (!dateStr) return "Unknown date"

    try {
      return new Date(dateStr).toLocaleDateString()
    } catch (e) {
      return "Invalid date"
    }
  }

  console.log("Rendering DocumentUpload component with documents from store:", documents)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Document Upload</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload your study materials in PDF, DOCX, or TXT format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">
                {selectedFile ? selectedFile.name : "Drag & Drop or Click to Upload"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Supports PDF, DOCX, and TXT files up to 50MB"}
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={isUploading || storeLoading}
              />
              {selectedFile && !isUploading && (
                <Button
                  onClick={handleUpload}
                  className="w-full mt-2"
                  disabled={isUploading || storeLoading}
                >
                  {isUploading ? "Processing..." : "Upload File"}
                </Button>
              )}
            </div>

            {isUploading && uploadProgress >= 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="progress-animation" />
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{uploadError}</span>
              </div>
            )}
            {storeError && !uploadError && (
              <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{storeError}</span>
              </div>
            )}

            {selectedDocument && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                <h4 className="font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Currently Active Document:
                </h4>
                <p className="text-sm mt-1">
                  {selectedDocument.filename}
                </p>
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

        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="processed">Processed</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {storeLoading && documents.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Clock className="h-10 w-10 mx-auto mb-4 text-muted-foreground animate-spin" />
                    <h3 className="text-lg font-medium">Loading documents...</h3>
                  </div>
                ) : documents.length > 0 ? (
                  documents.map((doc) => (
                    <Card
                      key={doc.id || doc.filename}
                      className={`flex flex-col md:flex-row md:items-center p-4 gap-4 ${
                        selectedDocument?.id === doc.id
                          ? "border-primary bg-secondary/20"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(
                          doc.type ||
                            doc.filename?.split(".").pop().toLowerCase()
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{doc.filename}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.pages || "?"} pages
                          </span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            Uploaded on {getDocumentDate(doc)}
                          </span>
                        </div>
                        <div className="mt-2">
                          {getDocumentStatus(doc) === "processed" ? (
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
                          variant="secondary"
                          size="sm"
                          className={
                            selectedDocument?.id === doc.id
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }
                          disabled={getDocumentStatus(doc) !== "processed" || storeLoading}
                          onClick={() => handleSelectDocument(doc)}
                        >
                          {selectedDocument?.id === doc.id
                            ? "Selected"
                            : "Select Document"}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(doc)}
                          disabled={storeLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No Documents Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first document to get started
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="processed">
              <div className="space-y-4">
                {documents.filter((doc) => getDocumentStatus(doc) === "processed")
                  .length > 0 ? (
                  documents
                    .filter((doc) => getDocumentStatus(doc) === "processed")
                    .map((doc) => (
                      <Card
                        key={doc.id || doc.filename}
                        className={`flex flex-col md:flex-row md:items-center p-4 gap-4 ${
                          selectedDocument?.id === doc.id
                            ? "border-primary bg-secondary/20"
                            : ""
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {getFileIcon(
                            doc.type ||
                              doc.filename?.split(".").pop().toLowerCase()
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{doc.filename}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(doc.size)}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {doc.pages || "?"} pages
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              Uploaded on {getDocumentDate(doc)}
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
                            variant="secondary"
                            size="sm"
                            className={
                              selectedDocument?.id === doc.id
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }
                            onClick={() => handleSelectDocument(doc)}
                            disabled={storeLoading}
                          >
                            {selectedDocument?.id === doc.id
                              ? "Selected"
                              : "Select Document"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(doc)}
                            disabled={storeLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">
                      No Processed Documents
                    </h3>
                    <p className="text-muted-foreground">
                      Your processed documents will appear here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="processing">
              <div className="space-y-4">
                {documents.filter((doc) => getDocumentStatus(doc) === "processing")
                  .length > 0 ? (
                  documents
                    .filter((doc) => getDocumentStatus(doc) === "processing")
                    .map((doc) => (
                      <Card
                        key={doc.id || doc.filename}
                        className="flex flex-col md:flex-row md:items-center p-4 gap-4"
                      >
                        <div className="flex-shrink-0">
                          {getFileIcon(
                            doc.type ||
                              doc.filename?.split(".").pop().toLowerCase()
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{doc.filename}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(doc.size)}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {doc.pages || "?"} pages
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              Uploaded on {getDocumentDate(doc)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline" className="animate-pulse">
                              <Clock className="h-3 w-3 mr-1" /> Processing...
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <Button variant="secondary" size="sm" disabled>
                            Select Document
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(doc)}
                            disabled={storeLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <CheckCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">
                      No Processing Documents
                    </h3>
                    <p className="text-muted-foreground">
                      All your documents have been processed
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {documentToDelete?.filename}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={storeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={storeLoading}
            >
              {storeLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

