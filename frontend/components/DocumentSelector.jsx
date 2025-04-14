"use client"

import { useState, useEffect } from 'react'
import { documentApi } from '@/lib/api'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2 } from 'lucide-react'

export function DocumentSelector({ onSelectDocument, selectedDocument, buttonText = "Upload Document" }) {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
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
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      // Log request details for debugging
      console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      const result = await documentApi.uploadDocument(file, true)
      if (result.status === "success" && result.document) {
        // Add new document to list and select it
        setDocuments(prev => [result.document, ...prev])
        onSelectDocument(result.document)
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Enhanced error reporting
      const errorMessage = error.response?.data?.detail || 
                           error.message || 
                           "Unknown server error";
      
      alert(`Failed to upload: ${errorMessage}. Please try again.`);
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleSelectDocument = (documentId) => {
    const document = documents.find(doc => doc.id === documentId)
    if (document) {
      onSelectDocument(document)
    }
  }
  
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="w-full md:w-2/3">
        <Select
          value={selectedDocument?.id || ""}
          onValueChange={handleSelectDocument}
          disabled={isLoading || documents.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a document" />
          </SelectTrigger>
          <SelectContent>
            {documents.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>{doc.filename}</span>
                  <span className="text-xs text-muted-foreground">({doc.pages} pages)</span>
                </div>
              </SelectItem>
            ))}
            {documents.length === 0 && !isLoading && (
              <div className="p-2 text-center text-muted-foreground">
                No documents available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-shrink-0">
        <Button
          variant="outline"
          as="label"
          htmlFor="document-upload"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
          <input
            id="document-upload"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </Button>
      </div>
    </div>
  )
}