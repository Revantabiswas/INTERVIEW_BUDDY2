import axios from 'axios';

// API base URL - set in your environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('API Base URL:', API_BASE_URL); // Debug log to verify the URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  // Increase default timeout to 60 seconds
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Document-specific axios instance with longer timeout
const documentApiAxios = axios.create({
  baseURL: API_BASE_URL,
  // Use a much longer timeout (2 minutes) for document operations
  timeout: 1200000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'An error occurred while processing your request');
  }
);

// Add same response interceptor to document API
documentApiAxios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Document API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'An error occurred while processing your document request');
  }
);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
const BASE_TIMEOUT = 60000; // 60 seconds base timeout
const TIMEOUT_PER_MB = 2000; // Additional 2 seconds per MB

// Document management API
const documentApi = {
  // Update your uploadDocument function to include better error handling
  uploadDocument: async (file, processNow = false) => {
    try {
      // Check file size before upload
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('process_now', processNow);

      // Calculate dynamic timeout based on file size
      const timeout = BASE_TIMEOUT + (file.size / (1024 * 1024)) * TIMEOUT_PER_MB;
      
      console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, timeout: ${timeout}ms`);
      
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
        timeout: timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      
      // If document is queued, poll for status
      if (data.status === 'queued') {
        return documentApi.pollDocumentStatus(data.id);
      }

      return data;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  },
  
  getAllDocuments: async () => {
    try {
      const response = await documentApiAxios.get('/api/documents');
      console.log("Documents response:", response);
      
      // Handle both nested and flat response formats
      if (response && Array.isArray(response)) {
        return response;
      } else if (response && response.documents && Array.isArray(response.documents)) {
        return response.documents;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.documents && Array.isArray(response.data.documents)) {
          return response.data.documents;
        }
      }
      
      console.warn("Unexpected documents response format:", response);
      return [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch documents");
    }
  },
  
  getDocument: async (documentId) => {
    const response = await documentApiAxios.get(`/api/documents/${documentId}`);
    return response.data;
  },
  
  deleteDocument: async (documentId) => {
    const response = await documentApiAxios.delete(`/api/documents/${documentId}`);
    return response.data;
  },

  async askQuestion(documentId, question) {
    try {
      const response = await documentApiAxios.post(`/api/chat/ask`, {
        document_id: documentId,
        question: question
      })
      return response.data
    } catch (error) {
      console.error("Error asking question:", error)
      throw new Error(error.response?.data?.detail || "Failed to process question")
    }
  },

  async generateNotes(documentId) {
    try {
      const response = await documentApiAxios.post(`/api/documents/${documentId}/notes`)
      return response.data
    } catch (error) {
      console.error("Error generating notes:", error)
      throw new Error(error.response?.data?.detail || "Failed to generate notes")
    }
  },

  async generateFlashcards(documentId) {
    try {
      const response = await documentApiAxios.post(`/api/documents/${documentId}/flashcards`)
      return response.data
    } catch (error) {
      console.error("Error generating flashcards:", error)
      throw new Error(error.response?.data?.detail || "Failed to generate flashcards")
    }
  },

  async generateMindMap(documentId) {
    try {
      const response = await documentApiAxios.post(`/api/documents/${documentId}/mindmap`)
      return response.data
    } catch (error) {
      console.error("Error generating mind map:", error)
      throw new Error(error.response?.data?.detail || "Failed to generate mind map")
    }
  },

  async generateTest(documentId) {
    try {
      const response = await documentApiAxios.post(`/api/documents/${documentId}/test`)
      return response.data
    } catch (error) {
      console.error("Error generating test:", error)
      throw new Error(error.response?.data?.detail || "Failed to generate test")
    }
  },

  async pollDocumentStatus(documentId, maxAttempts = 30) {
    let attempts = 0;
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/documents/status/${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to get document status');
        }

        const data = await response.json();
        console.log('Document status:', data);

        if (data.status === 'processed') {
          return data;
        } else if (data.status === 'processing_failed') {
          throw new Error(data.message || 'Document processing failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        console.error('Error polling document status:', error);
        throw error;
      }
    }

    throw new Error('Document processing timed out');
  },
};

// Chat API
const chatApi = {
  async askQuestion(question, history = [], documentIds = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...history,
            { role: 'user', content: question }
          ],
          document_ids: documentIds
        }),
      });

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to get response: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  },

  async getDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch documents');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  getChatHistory: async (documentId) => {
    try {
      const response = await api.get(`/api/chat/history/${documentId}`);
      return response.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
        sources: msg.sources || []
      }));
    } catch (error) {
      console.error("Error fetching chat history:", error);
      if (error.response?.status === 404) {
        throw new Error("Document not found. Please select a valid document.");
      }
      throw new Error(error.response?.data?.detail || "Failed to fetch chat history");
    }
  },
  
  clearChatHistory: async (documentId) => {
    try {
      await api.delete(`/api/chat/history/${documentId}`);
      return true;
    } catch (error) {
      console.error("Error clearing chat history:", error);
      if (error.response?.status === 404) {
        throw new Error("Document not found. Please select a valid document.");
      }
      throw new Error(error.response?.data?.detail || "Failed to clear chat history");
    }
  }
};

// Study Notes API
const notesApi = {
  generateNotes: async (topic, documentId) => {
    const response = await api.post('/api/notes/generate', {
      topic,
      document_id: documentId,
    });
    return response.data;
  },
  
  getAllNotes: async () => {
    const response = await api.get('/api/notes');
    return response.data;
  },
  
  getNote: async (noteId) => {
    const response = await api.get(`/api/notes/${noteId}`);
    return response.data;
  },
  
  deleteNote: async (noteId) => {
    const response = await api.delete(`/api/notes/${noteId}`);
    return response.data;
  },
};

// Flashcards API
const flashcardsApi = {
  generateFlashcards: async (topic, documentId, numCards = 10) => {
    const response = await api.post('/api/flashcards/generate', {
      topic,
      document_id: documentId,
      num_cards: numCards,
    });
    return response.data;
  },
  
  getAllFlashcards: async () => {
    const response = await api.get('/api/flashcards');
    return response.data;
  },
  
  getFlashcardDeck: async (deckId) => {
    const response = await api.get(`/api/flashcards/${deckId}`);
    return response.data;
  },
  
  deleteFlashcardDeck: async (deckId) => {
    const response = await api.delete(`/api/flashcards/${deckId}`);
    return response.data;
  },
};

// Mind Maps API
const mindMapsApi = {
  generateMindMap: async (topic, documentId) => {
    const response = await api.post('/api/mindmaps/generate', {
      topic,
      document_id: documentId,
    });
    return response.data;
  },
  
  getAllMindMaps: async () => {
    const response = await api.get('/api/mindmaps');
    return response.data;
  },
  
  getMindMap: async (mapId) => {
    const response = await api.get(`/api/mindmaps/${mapId}`);
    return response.data;
  },
  
  deleteMindMap: async (mapId) => {
    const response = await api.delete(`/api/mindmaps/${mapId}`);
    return response.data;
  },
};

// Study Roadmaps API
const roadmapsApi = {
  generateRoadmap: async (documentId, daysAvailable, hoursPerDay, quickMode = false) => {
    console.log('Generating roadmap with params:', { documentId, daysAvailable, hoursPerDay, quickMode });
    try {
      // Adding better error handling and debugging
      const requestData = {
        document_id: documentId,
        days_available: daysAvailable,
        hours_per_day: hoursPerDay,
        quick_mode: quickMode,
      };
      console.log('API request payload:', requestData);
      
      // Use a longer timeout for roadmap generation as it might take time
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/roadmaps/generate`,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 180000, // 3 minute timeout
      });
      
      console.log('Roadmap API raw response:', response);
      return response.data;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to generate roadmap');
    }
  },
  
  getAllRoadmaps: async () => {
    const response = await api.get('/api/roadmaps');
    return response.data;
  },
  
  getRoadmap: async (roadmapId) => {
    const response = await api.get(`/api/roadmaps/${roadmapId}`);
    return response.data;
  },
  
  deleteRoadmap: async (roadmapId) => {
    const response = await api.delete(`/api/roadmaps/${roadmapId}`);
    return response.data;
  },
};

// Tests API
const testsApi = {
  generateTest: async (topic, documentId, difficulty = "Medium") => {
    const response = await api.post('/api/tests/generate', {
      topic,
      document_id: documentId,
      difficulty,
    });
    return response.data;
  },
  
  getAllTests: async () => {
    const response = await api.get('/api/tests');
    return response.data;
  },
  
  getTest: async (testId) => {
    const response = await api.get(`/api/tests/${testId}`);
    return response.data;
  },
  
  deleteTest: async (testId) => {
    const response = await api.delete(`/api/tests/${testId}`);
    return response.data;
  },
  
  submitTestAnswers: async (testId, answers) => {
    const response = await api.post(`/api/tests/${testId}/submit`, { answers });
    return response.data;
  },
};

// DSA Interview APIs
const dsaApi = {
  getQuestions: async (filters = {}) => {
    const response = await api.post('/api/dsa/questions', filters);
    return response.data;
  },
  
  getPersonalizedPlan: async (userGoals) => {
    const response = await api.post('/api/dsa/plan', userGoals);
    return response.data;
  },
  
  analyzeCode: async (code, problem, language) => {
    const response = await api.post('/api/dsa/analyze-code', {
      code,
      problem,
      language,
    });
    return response.data;
  },
};

// Progress Tracking API
const progressApi = {
  getProgressData: async () => {
    const response = await api.get('/api/progress');
    return response.data;
  },
  
  updateProgressData: async (progressData) => {
    const response = await api.post('/api/progress/update', progressData);
    return response.data;
  },
};

// Export all APIs
export {
  documentApi,
  chatApi,
  notesApi,
  flashcardsApi,
  mindMapsApi,
  roadmapsApi,
  testsApi,
  dsaApi,
  progressApi,
};

export default {
  documents: documentApi,
  chat: chatApi,
  notes: notesApi,
  flashcards: flashcardsApi,
  mindMaps: mindMapsApi,
  roadmaps: roadmapsApi,
  tests: testsApi,
  dsa: dsaApi,
  progress: progressApi,
};