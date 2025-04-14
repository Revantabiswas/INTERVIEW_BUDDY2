import { create } from 'zustand';

/**
 * Zustand store for managing document state.
 *
 * @property {Array} documents - List of available document objects fetched from the backend. Each object should have at least 'id' and 'filename'.
 * @property {object|null} selectedDocument - The document object currently selected by the user. Should have at least 'id' and 'filename'.
 * @property {boolean} loading - Indicates if documents are currently being fetched or modified.
 * @property {string|null} error - Stores error messages related to document operations.
 * @function setDocuments - Updates the list of documents. Ensures 'id' is present.
 * @function setSelectedDocument - Sets the currently selected document. Ensures 'id' is present.
 * @function setLoading - Sets the loading state.
 * @function setError - Sets the error state.
 */
const useDocumentStore = create((set) => ({
  documents: [], // List of all available documents { id, filename, pages, ... }
  selectedDocument: null, // The currently selected document object { id, filename, ... }
  loading: false,
  error: null,

  setDocuments: (docs) => set((state) => {
    const validDocs = Array.isArray(docs) ? docs : [];
    const processedDocs = validDocs.map(doc => ({
      ...doc,
      id: doc.id || doc.filename, // Ensure id exists, using filename as fallback
    }));
    return { documents: processedDocs, error: null };
  }),

  setSelectedDocument: (doc) => set((state) => {
    if (doc && !doc.id && doc.filename) {
      // If setting a doc without an id, try to use filename
      return { selectedDocument: { ...doc, id: doc.filename } };
    }
    // If doc is null or already has an id
    return { selectedDocument: doc };
  }),

  setLoading: (isLoading) => set({ loading: isLoading }),

  setError: (err) => set({ error: err, loading: false }),
}));

export default useDocumentStore;
