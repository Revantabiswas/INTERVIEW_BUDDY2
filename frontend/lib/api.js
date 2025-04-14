import axios from 'axios';

// API base URL - set in your environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document management API
const documentApi = {
  uploadDocument: async (file, processNow = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('process_now', processNow ? 'true' : 'false');
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getAllDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  
  getDocument: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },
  
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },
};

// Chat API
const chatApi = {
  askQuestion: async (question, documentId, history = []) => {
    const response = await api.post('/chat/ask', {
      question,
      document_id: documentId,
      history,
    });
    return response.data;
  },
  
  getChatHistory: async (documentId) => {
    const response = await api.get(`/chat/history/${documentId}`);
    return response.data;
  },
  
  clearChatHistory: async (documentId) => {
    const response = await api.delete(`/chat/history/${documentId}`);
    return response.data;
  },
};

// Study Notes API
const notesApi = {
  generateNotes: async (topic, documentId) => {
    const response = await api.post('/notes/generate', {
      topic,
      document_id: documentId,
    });
    return response.data;
  },
  
  getAllNotes: async () => {
    const response = await api.get('/notes');
    return response.data;
  },
  
  getNote: async (noteId) => {
    const response = await api.get(`/notes/${noteId}`);
    return response.data;
  },
  
  deleteNote: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
};

// Flashcards API
const flashcardsApi = {
  generateFlashcards: async (topic, documentId, numCards = 10) => {
    const response = await api.post('/flashcards/generate', {
      topic,
      document_id: documentId,
      num_cards: numCards,
    });
    return response.data;
  },
  
  getAllFlashcards: async () => {
    const response = await api.get('/flashcards');
    return response.data;
  },
  
  getFlashcardDeck: async (deckId) => {
    const response = await api.get(`/flashcards/${deckId}`);
    return response.data;
  },
  
  deleteFlashcardDeck: async (deckId) => {
    const response = await api.delete(`/flashcards/${deckId}`);
    return response.data;
  },
};

// Mind Maps API
const mindMapsApi = {
  generateMindMap: async (topic, documentId) => {
    const response = await api.post('/mindmaps/generate', {
      topic,
      document_id: documentId,
    });
    return response.data;
  },
  
  getAllMindMaps: async () => {
    const response = await api.get('/mindmaps');
    return response.data;
  },
  
  getMindMap: async (mapId) => {
    const response = await api.get(`/mindmaps/${mapId}`);
    return response.data;
  },
  
  deleteMindMap: async (mapId) => {
    const response = await api.delete(`/mindmaps/${mapId}`);
    return response.data;
  },
};

// Study Roadmaps API
const roadmapsApi = {
  generateRoadmap: async (documentId, daysAvailable, hoursPerDay, quickMode = false) => {
    const response = await api.post('/roadmaps/generate', {
      document_id: documentId,
      days_available: daysAvailable,
      hours_per_day: hoursPerDay,
      quick_mode: quickMode,
    });
    return response.data;
  },
  
  getAllRoadmaps: async () => {
    const response = await api.get('/roadmaps');
    return response.data;
  },
  
  getRoadmap: async (roadmapId) => {
    const response = await api.get(`/roadmaps/${roadmapId}`);
    return response.data;
  },
  
  deleteRoadmap: async (roadmapId) => {
    const response = await api.delete(`/roadmaps/${roadmapId}`);
    return response.data;
  },
};

// Tests API
const testsApi = {
  generateTest: async (topic, documentId, difficulty = "Medium") => {
    const response = await api.post('/tests/generate', {
      topic,
      document_id: documentId,
      difficulty,
    });
    return response.data;
  },
  
  getAllTests: async () => {
    const response = await api.get('/tests');
    return response.data;
  },
  
  getTest: async (testId) => {
    const response = await api.get(`/tests/${testId}`);
    return response.data;
  },
  
  deleteTest: async (testId) => {
    const response = await api.delete(`/tests/${testId}`);
    return response.data;
  },
  
  submitTestAnswers: async (testId, answers) => {
    const response = await api.post(`/tests/${testId}/submit`, { answers });
    return response.data;
  },
};

// DSA Interview APIs
const dsaApi = {
  getQuestions: async (filters = {}) => {
    const response = await api.post('/dsa/questions', filters);
    return response.data;
  },
  
  getPersonalizedPlan: async (userGoals) => {
    const response = await api.post('/dsa/plan', userGoals);
    return response.data;
  },
  
  analyzeCode: async (code, problem, language) => {
    const response = await api.post('/dsa/analyze-code', {
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
    const response = await api.get('/progress');
    return response.data;
  },
  
  updateProgressData: async (progressData) => {
    const response = await api.post('/progress/update', progressData);
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