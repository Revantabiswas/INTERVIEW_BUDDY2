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
    // Return a rejected promise with a clearer error message
    return Promise.reject(new Error(error.response?.data?.detail || error.message || 'An error occurred while processing your request'));
  }
);

// Add same response interceptor to document API
documentApiAxios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Document API Error:', error.response?.data || error.message);
    // Return a rejected promise with a clearer error message
    return Promise.reject(new Error(error.response?.data?.detail || error.message || 'An error occurred while processing your document request'));
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

  // Deprecated: Use flashcardsApi.generateFlashcards instead
  async generateFlashcards(documentId) {
    console.warn("This method is deprecated. Please use flashcardsApi.generateFlashcards instead.");
    try {
      const response = await flashcardsApi.generateFlashcards("full document", documentId);
      return response;
    } catch (error) {
      console.error("Error generating flashcards:", error)
      throw error;
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
    try {
      console.log(`Generating notes for topic "${topic}" and document ${documentId}`);
      const response = await api.post('/api/notes/generate', {
        topic,
        document_id: documentId,
      });
      console.log("Notes generation response:", response);
      return response;
    } catch (error) {
      console.error("Error generating notes:", error);
      throw new Error(error.response?.data?.detail || "Failed to generate study notes");
    }
  },
  
  getAllNotes: async () => {
    try {
      console.log("Fetching all notes");
      const response = await api.get('/api/notes');
      console.log("Notes response:", response);
      
      // Ensure we're returning an array
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected notes response format:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch notes");
    }
  },
  
  getNote: async (noteId) => {
    try {
      const response = await api.get(`/api/notes/${noteId}`);
      return response;
    } catch (error) {
      console.error("Error fetching note:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch note");
    }
  },
  
  deleteNote: async (noteId) => {
    try {
      const response = await api.delete(`/api/notes/${noteId}`);
      return response;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error(error.response?.data?.detail || "Failed to delete note");
    }
  },
};

// Flashcards API
const flashcardsApi = {
  generateFlashcards: async (topic, documentId, numCards = 10) => {
    try {
      console.log(`Generating flashcards for topic "${topic}" and document ${documentId}`);
      const response = await api.post('/api/flashcards/generate', {
        topic,
        document_id: documentId,
        num_cards: numCards,
      });
      
      console.log("Raw flashcards generation response:", response);
      
      // Handle potential response format issues
      if (!response) {
        throw new Error("Received empty response from server");
      }
      
      // Normalize the response format
      const normalizedResponse = {
        ...response,
        // Ensure consistent 'cards' field exists
        cards: Array.isArray(response.cards) ? response.cards.map(card => {
          // If card is a string, try to parse it
          if (typeof card === 'string') {
            try {
              return JSON.parse(card);
            } catch (e) {
              return { front: card, back: "No content available" };
            }
          }
          
          // Handle potential string formatting issues in card content
          if (card && typeof card === 'object') {
            const front = card.front || card.question || card.term || "";
            const back = card.back || card.answer || card.definition || "";
            
            // Sanitize any potential format specifiers
            return {
              front: String(front).replace(/%/g, '%%'),
              back: String(back).replace(/%/g, '%%')
            };
          }
          
          return card;
        }) : (response.flashcards || []),
        // Ensure other required fields exist
        id: response.id || `${Date.now()}`,
        topic: response.topic || topic,
        document_id: response.document_id || documentId,
        created_at: response.created_at || new Date().toISOString()
      };
      
      console.log("Normalized flashcards response:", normalizedResponse);
      
      if (normalizedResponse.cards.length === 0) {
        console.warn("Generated flashcard deck contains no cards");
      }
      
      return normalizedResponse;
    } catch (error) {
      console.error("Error generating flashcards:", error);
      throw new Error(error.response?.data?.detail || error.message || "Failed to generate flashcards");
    }
  },
  
  getAllFlashcards: async () => {
    try {
      console.log("Fetching all flashcard decks");
      const response = await api.get('/api/flashcards');
      console.log("Raw flashcard decks response:", response);
      
      // Handle potential response format issues
      if (!response) {
        console.warn("Received empty response from server when fetching flashcards");
        return [];
      }
      
      // Process the response to ensure consistent format
      if (Array.isArray(response)) {
        return response.map(deck => {
          // Normalize each deck
          return {
            ...deck,
            // Ensure cards field exists and has the right name
            cards: deck.cards || deck.flashcards || [],
            // Ensure other required fields exist with fallbacks
            id: deck.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            topic: deck.topic || "Untitled Deck",
            document_id: deck.document_id,
            created_at: deck.created_at || new Date().toISOString()
          };
        });
      }
      
      console.warn("Unexpected response format from flashcards API:", response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      throw new Error(error.response?.data?.detail || error.message || "Failed to fetch flashcards");
    }
  },
  
  getFlashcardDeck: async (deckId) => {
    try {
      console.log(`Fetching flashcard deck ${deckId}`);
      const response = await api.get(`/api/flashcards/${deckId}`);
      console.log(`Raw flashcard deck ${deckId} response:`, response);
      
      if (!response) {
        throw new Error(`Flashcard deck with ID ${deckId} not found`);
      }
      
      // Ensure consistent format
      const normalizedDeck = {
        ...response,
        cards: response.cards || response.flashcards || [],
        id: response.id || deckId,
        topic: response.topic || "Untitled Deck",
        created_at: response.created_at || new Date().toISOString()
      };
      
      return normalizedDeck;
    } catch (error) {
      console.error(`Error fetching flashcard deck ${deckId}:`, error);
      throw new Error(error.response?.data?.detail || error.message || "Failed to fetch flashcard deck");
    }
  },
  
  deleteFlashcardDeck: async (deckId) => {
    try {
      console.log(`Deleting flashcard deck ${deckId}`);
      const response = await api.delete(`/api/flashcards/${deckId}`);
      console.log(`Flashcard deck ${deckId} deletion response:`, response);
      return response;
    } catch (error) {
      console.error(`Error deleting flashcard deck ${deckId}:`, error);
      throw new Error(error.response?.data?.detail || error.message || "Failed to delete flashcard deck");
    }
  },
};

// Mind Maps API
const mindMapsApi = {
  generateMindMap: async (documentId, topic) => {
    try {
      console.log(`Generating mind map for topic "${topic}" and document ${documentId}`);
      const response = await api.post('/api/mindmaps/generate', {
        topic,
        document_id: documentId,
      });
      console.log("Mind map generation response:", response);
      return response;
    } catch (error) {
      console.error("Error generating mind map:", error);
      throw new Error(error.response?.data?.detail || "Failed to generate mind map");
    }
  },
  
  getAllMindMaps: async () => {
    try {
      console.log("Fetching all mind maps");
      const response = await api.get('/api/mindmaps');
      console.log("Mind maps response:", response);
      
      // Ensure we're returning an array
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected mind maps response format:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching mind maps:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch mind maps");
    }
  },
  
  getMindMap: async (mapId) => {
    try {
      const response = await api.get(`/api/mindmaps/${mapId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching mind map ${mapId}:`, error);
      throw new Error(error.response?.data?.detail || "Failed to fetch mind map");
    }
  },
  
  deleteMindMap: async (mapId) => {
    try {
      const response = await api.delete(`/api/mindmaps/${mapId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting mind map ${mapId}:`, error);
      throw new Error(error.response?.data?.detail || "Failed to delete mind map");
    }
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
  generateTest: async (topic, documentId = null, difficulty = "Medium") => {
    try {
      console.log(`Generating test for topic "${topic}" with difficulty "${difficulty}"`);
      const requestData = {
        topic,
        difficulty,
      };
      
      // Only include document_id in the request if it's provided
      if (documentId) {
        requestData.document_id = documentId;
      }
      
      const response = await api.post('/api/tests/generate', requestData);
      
      // api.post already returns response.data due to our interceptor
      console.log("Test generation response:", response);
      
      // Format the response for frontend compatibility
      if (response && response.questions) {
        // Ensure questions have consistent format with both question/text fields
        response.questions = response.questions.map((q, index) => {
          return {
            ...q,
            id: q.id || `q${index}`, // Ensure each question has an ID
            text: q.text || q.question || "", // Ensure text field exists
            question: q.question || q.text || "", // Ensure question field exists
            type: q.options ? "multiple-choice" : "short-answer" // Set type based on options
          };
        });
      }
      
      // Add a title field if missing
      if (response && !response.title) {
        response.title = response.topic;
      }
      
      // Add a default timeLimit if none is provided
      if (response && !response.timeLimit) {
        response.timeLimit = difficulty === "Easy" ? 10 : difficulty === "Medium" ? 15 : 20;
      }
      
      return response; // This is already the data from our interceptor
    } catch (error) {
      console.error("Error generating test:", error);
      throw new Error(error.response?.data?.detail || "Failed to generate test");
    }
  },
  
  getAllTests: async () => {
    try {
      console.log("Fetching all tests");
      const response = await api.get('/api/tests');
      console.log("Tests response:", response);
      
      // Ensure we're returning an array
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected tests response format:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch tests");
    }
  },
  
  getTest: async (testId) => {
    try {
      console.log(`Fetching test ${testId}`);
      const response = await api.get(`/api/tests/${testId}`);
      
      // Process the response to ensure consistent question format
      if (response && response.questions) {
        response.questions = response.questions.map((q, index) => {
          // Normalize questions to have both question and text fields
          return {
            ...q,
            id: q.id || `q${index}`,
            text: q.text || q.question,
            question: q.question || q.text,
            type: q.options ? "multiple-choice" : "short-answer"
          };
        });
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching test ${testId}:`, error);
      throw new Error(error.response?.data?.detail || "Failed to fetch test");
    }
  },
  
  deleteTest: async (testId) => {
    try {
      console.log(`Deleting test ${testId}`);
      const response = await api.delete(`/api/tests/${testId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting test ${testId}:`, error);
      throw new Error(error.response?.data?.detail || "Failed to delete test");
    }
  },
  
  submitTestAnswers: async (testId, answers) => {
    try {
      console.log(`Submitting answers for test ${testId}:`, answers);
      const response = await api.post(`/api/tests/${testId}/submit`, { answers });
      return response;
    } catch (error) {
      console.error(`Error submitting test ${testId} answers:`, error);
      throw new Error(error.response?.data?.detail || "Failed to submit test answers");
    }
  },
};

// DSA Interview APIs
const dsaApi = {
  getQuestions: async (filters = {}) => {
    try {
      const response = await api.post('/api/dsa/questions', filters);
      return response || { data: [] };
    } catch (error) {
      console.error("Error fetching DSA questions:", error);
      return { data: [] };
    }
  },
  
  getPersonalizedPlan: async (userGoals) => {
    try {
      const response = await api.post('/api/dsa/plan', userGoals);
      return response || { data: {} };
    } catch (error) {
      console.error("Error fetching personalized plan:", error);
      return { data: {} };
    }
  },
  
  analyzeCode: async (code, problem, language) => {
    try {
      console.log("Analyzing code with params:", { code, problem, language });
      
      // Using the raw axios instance to avoid response interceptors
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/dsa/analyze-code`,
        data: {
          code,
          problem,
          language,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        // Increase timeout for code analysis which might take longer
        timeout: 30000, 
      });
      
      console.log("Code analysis response:", response.data);
      
      // Return the data directly
      return response.data;
    } catch (error) {
      console.error("Error analyzing code:", error);
      console.error("Error details:", error.response?.data || error.message);
      
      // Throw a more descriptive error
      throw new Error(error.response?.data?.detail || error.message || "Failed to analyze code");
    }
  },
  
  generateEdgeCases: async (problem, userSolution, language = "javascript") => {
    try {
      console.log("Generating edge cases with params:", { problem, language });
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/dsa/generate-edge-cases`,
        data: {
          problem_description: typeof problem === 'object' ? problem.description : problem,
          solution_code: userSolution,
          language,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000, // Longer timeout for AI edge case generation
      });
      
      console.log("Edge cases generation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error generating edge cases:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || "Failed to generate edge cases");
    }
  },
  
  runEdgeTests: async (problem, userSolution, edgeCases, language = "javascript") => {
    try {
      console.log("Running edge tests with params:", { problem, edgeCases, language });
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/dsa/run-edge-tests`,
        data: {
          problem_description: typeof problem === 'object' ? problem.description : problem,
          solution_code: userSolution,
          edge_cases: edgeCases,
          language,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      console.log("Edge tests results:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error running edge tests:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || "Failed to run edge tests");
    }
  },
};

// Exam Practice API
const examPracticeApi = {
  generateExam: async (examData) => {
    try {
      console.log('Generating exam with data:', examData);
      const response = await api.post('/api/exam-practice/exams/generate', {
        board: examData.board,
        class_level: examData.class_level,
        subject: examData.subject,
        topic: examData.topic,
        difficulty: examData.difficulty,
        question_count: examData.question_count,
        duration: examData.duration
      });
      console.log('Exam generation response:', response);
      return response;
    } catch (error) {
      console.error('Error generating exam:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to generate exam');
    }
  },

  startExam: async (examId) => {
    try {
      console.log(`Starting exam ${examId}`);
      const response = await api.post(`/api/exam-practice/exams/${examId}/start`);
      console.log('Exam start response:', response);
      return response;
    } catch (error) {
      console.error('Error starting exam:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to start exam');
    }
  },

  submitExamAttempt: async (attemptId, submissionData) => {
    try {
      console.log(`Submitting exam attempt ${attemptId}:`, submissionData);
      const response = await api.post(`/api/exam-practice/exams/attempts/${attemptId}/submit`, {
        answers: submissionData.answers,
        time_spent: submissionData.time_spent,
        completed_at: submissionData.completed_at,
        skipped_questions: submissionData.skipped_questions || [],
        bookmarked_questions: submissionData.bookmarked_questions || []
      });
      console.log('Exam submission response:', response);
      return response;
    } catch (error) {
      console.error('Error submitting exam attempt:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to submit exam attempt');
    }
  },

  getAllExams: async () => {
    try {
      console.log('Fetching all exams');
      const response = await api.get('/api/exam-practice/exams');
      console.log('All exams response:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch exams');
    }
  },

  getExam: async (examId) => {
    try {
      console.log(`Fetching exam ${examId}`);
      const response = await api.get(`/api/exam-practice/exams/${examId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching exam ${examId}:`, error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch exam');
    }
  },

  getExamAttempts: async (examId) => {
    try {
      console.log(`Fetching attempts for exam ${examId}`);
      const response = await api.get(`/api/exam-practice/exams/${examId}/attempts`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Error fetching exam attempts for ${examId}:`, error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch exam attempts');
    }
  },

  getAttemptResults: async (attemptId) => {
    try {
      console.log(`Fetching results for attempt ${attemptId}`);
      const response = await api.get(`/api/exam-practice/exams/attempts/${attemptId}/results`);
      return response;
    } catch (error) {
      console.error(`Error fetching attempt results for ${attemptId}:`, error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch attempt results');
    }
  }
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

// Forum API
const forumApi = {
  getAllPosts: async () => {
    try {
      console.log("Fetching all forum posts");
      const response = await api.get('/api/forum/posts');
      console.log("Forum posts response:", response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected forum posts response format:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      throw new Error(error.response?.data?.detail || "Failed to fetch forum posts");
    }
  },
  
  getPost: async (postId) => {
    try {
      console.log(`Fetching forum post ${postId}`);
      const response = await api.get(`/api/forum/posts/${postId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching forum post ${postId}:`, error);
      throw new Error(error.response?.data?.detail || "Failed to fetch forum post");
    }
  },
  
  createPost: async (title, content, userId, tags = []) => {
    try {
      console.log(`Creating forum post: ${title}`);
      // Use direct axios call to avoid response interceptor issues
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/forum/create-post`,
        data: {
          title,
          content,
          user_id: userId,
          tags
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      console.log("Create post response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating forum post:", error);
      // More detailed error extraction
      const errorMessage = 
        error.response?.data?.detail || 
        (typeof error.message === 'string' ? error.message : 'Failed to create forum post');
      throw new Error(errorMessage);
    }
  },
  
  analyzeText: async (text, options = {}) => {
    try {
      console.log(`Analyzing text: ${text.substring(0, 50)}...`);
      const response = await api.post('/api/forum/analyze-text', {
        text,
        options
      });
      console.log("Text analysis response:", response);
      return response;
    } catch (error) {
      console.error("Error analyzing text:", error);
      throw new Error(error.response?.data?.detail || "Failed to analyze text");
    }
  }
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
  forumApi,
  examPracticeApi,
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
  forum: forumApi,
  examPractice: examPracticeApi,
};