"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useDocumentService } from "@/hooks/useDocumentService"
import { useToast } from "@/components/ui/use-toast"

export default function DocumentLoader({ onDocumentSelect }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const { toast } = useToast()
  
  const {
    documents,
    loading: isLoading,
    error,
    uploadProgress,
    uploadDocument,
    fetchDocuments
  } = useDocumentService()

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
      .catch(err => {
        console.error("Failed to fetch documents:", err)
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive"
        })
      })
  }, [fetchDocuments, toast])

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setUploadSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await uploadDocument(selectedFile)
      setSelectedFile(null)
      setUploadSuccess(true)
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })
      
      // Reset file input
      if (document.getElementById('file-upload')) {
        document.getElementById('file-upload').value = ''
      }
    } catch (err) {
      console.error("Upload failed:", err)
      // Error will be handled by the useEffect above
    }
  }

  const handleSelectDocument = (document) => {
    setCurrentDocument(document)
    if (onDocumentSelect) {
      onDocumentSelect(document)
    }
  }

  // Determine document status
  const getDocumentStatus = (doc) => {
    // If status is explicitly set, use it
    if (doc.status) return doc.status
    
    // Infer status based on other properties
    return (doc.pages && doc.pages > 0) ? "processed" : "processing"
  }

  return (
    <div className="document-loader space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Upload Study Material</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files to chat with them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => document.getElementById("file-upload").click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              {selectedFile ? selectedFile.name : "Drag & Drop or Click to Upload"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedFile
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                : "Supports PDF, DOCX, and TXT files"}
            </p>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            
            {selectedFile && !isLoading && (
              <Button onClick={handleUpload} className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Upload Document"}
              </Button>
            )}
          </div>

          {isLoading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="progress-animation" />
            </div>
          )}
            
          {uploadSuccess && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Document uploaded successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              Select a document to start chatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div 
                  key={doc.id || doc.filename}
                  className={`flex items-center p-3 rounded-md cursor-pointer border ${
                    currentDocument?.id === doc.id || currentDocument?.filename === doc.filename
                      ? 'bg-secondary border-primary'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => handleSelectDocument(doc)}
                >
                  <FileText className={`h-5 w-5 mr-3 ${
                    doc.type === 'pdf' ? 'text-red-500' : 
                    doc.type === 'docx' ? 'text-blue-500' : 
                    'text-gray-500'
                  }`} />
                  <div className="flex-grow">
                    <p className="font-medium">{doc.name || doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pages ? `${doc.pages} pages` : 'Processing...'}
                    </p>
                  </div>
                  <div className="ml-2">
                    {getDocumentStatus(doc) === "processed" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {currentDocument && (
            <CardFooter className="pt-3 border-t">
              <div className="w-full">
                <p className="text-sm text-muted-foreground">
                  Currently selected: <span className="font-medium">{currentDocument.name || currentDocument.filename}</span>
                </p>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}
