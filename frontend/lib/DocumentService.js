import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global document state management
 * Handles document selection across the application
 */
const useDocumentStore = create(
  persist(
    (set, get) => ({
      selectedDocument: null,
      setSelectedDocument: (document) => set({ selectedDocument: document }),
      clearSelectedDocument: () => set({ selectedDocument: null }),
    }),
    {
      name: 'document-storage',
      getStorage: () => (typeof window !== 'undefined' ? window.localStorage : null),
    }
  )
);

export { useDocumentStore };

/**
 * Helper functions for working with documents
 */
export const DocumentService = {
  selectDocument: (document) => {
    useDocumentStore.getState().setSelectedDocument(document);
    return document;
  },
  
  getSelectedDocument: () => {
    return useDocumentStore.getState().selectedDocument;
  },
  
  clearSelectedDocument: () => {
    useDocumentStore.getState().clearSelectedDocument();
  },
  
  getFileIcon: (type) => {
    if (!type && typeof document?.filename === 'string') {
      const extension = document.filename.split('.').pop().toLowerCase();
      type = extension;
    }
    
    switch (type) {
      case "pdf":
        return "pdf";
      case "docx":
        return "docx";
      case "txt":
        return "txt";
      default:
        return "file";
    }
  },
  
  getDocumentStatus: (doc) => {
    if (!doc) return "unknown";
    
    // If status is explicitly set, use it
    if (doc.status) return doc.status;
    
    // Infer status based on other properties
    return (doc.pages && doc.pages > 0) ? "processed" : "processing";
  },
  
  formatFileSize: (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size";
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(1)} MB`;
  }
};

export default DocumentService;
