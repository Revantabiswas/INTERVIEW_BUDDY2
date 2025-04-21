"use client"

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import { documentApi } from "@/lib/api"

export function DocumentSelector({ 
  selectedDocument, 
  onSelectDocument, 
  documents: externalDocuments, 
  isLoading: externalLoading,
  buttonText = "Select Document" 
}) {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Use either externally provided documents or fetch our own
  useEffect(() => {
    if (externalDocuments) {
      setDocuments(externalDocuments)
    } else {
      fetchDocuments()
    }
  }, [externalDocuments])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await documentApi.getAllDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use external loading state if provided, otherwise use internal state
  const loading = externalLoading !== undefined ? externalLoading : isLoading

  return (
    <Select value={selectedDocument} onValueChange={onSelectDocument}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading documents..." : buttonText} />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="flex items-center justify-center p-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              {doc.filename || doc.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-docs" disabled>
            No documents found. Please upload some first.
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}