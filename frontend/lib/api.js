import axios from 'axios';

// --- Configuration ---
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const defaultApiUrl = 'http://localhost:5000/api'; // Default backend URL including /api prefix
const API_URL = envApiUrl || defaultApiUrl;

// Log the API URL being used
console.log(`API client configured for: ${API_URL}`);
if (envApiUrl) {
  console.log(`(Using NEXT_PUBLIC_API_URL environment variable)`);
} else {
  console.log(`(Using default URL)`);
}

// --- Axios Instance Setup ---
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for session management if needed
  timeout: 30000, // 30 seconds default timeout
});

// --- Interceptors ---

// Request Interceptor: Log requests
API.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    // Future: Add Authorization header if implementing token-based auth
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle responses and errors globally
API.interceptors.response.use(
  (response) => {
    // Return the data directly for convenience
    return response.data;
  },
  (error) => {
    let userMessage = "An unexpected error occurred. Please try again later.";
    let statusCode = null;

    if (error.response) {
      // Server responded with a status code outside the 2xx range
      statusCode = error.response.status;
      const responseData = error.response.data;
      console.error("API Error Response:", {
        status: statusCode,
        statusText: error.response.statusText,
        data: responseData,
        url: error.config?.url,
      });

      // Extract a meaningful message from the response
      if (responseData) {
        if (typeof responseData === 'string') {
          userMessage = responseData;
        } else if (responseData.error && typeof responseData.error === 'string') {
          userMessage = responseData.error;
        } else if (responseData.message && typeof responseData.message === 'string') {
          userMessage = responseData.message;
        } else if (statusCode === 400) {
          userMessage = "Invalid request. Please check your input.";
        } else if (statusCode === 401) {
          userMessage = "Authentication failed. Please log in again.";
        } else if (statusCode === 403) {
          userMessage = "You do not have permission to perform this action.";
        } else if (statusCode === 404) {
          userMessage = "The requested resource was not found.";
        } else if (statusCode >= 500) {
          userMessage = "Server error. Please contact support if the problem persists.";
        }
      } else if (error.response.statusText) {
         userMessage = `Error ${statusCode}: ${error.response.statusText}`;
      }

    } else if (error.request) {
      // Request was made but no response received (network error, timeout)
      console.error("API No Response Error:", {
         message: error.message,
         url: error.config?.url,
      });
      if (error.code === 'ECONNABORTED') {
        userMessage = "The request timed out. Please check your connection and try again.";
      } else {
        userMessage = "Network error. Could not connect to the server.";
      }
    } else {
      // Error setting up the request
      console.error("API Setup Error:", error.message);
      userMessage = `Request setup failed: ${error.message}`;
    }

    // Attach a user-friendly message to the error object
    error.userMessage = userMessage;
    error.statusCode = statusCode; // Attach status code if available

    return Promise.reject(error); // Reject the promise so calling code can handle it
  }
);

// --- Helper Function for Error Messages ---
export const getErrorMessage = (error) => {
  // Use the userMessage attached by the interceptor if available
  if (error?.userMessage) {
    return error.userMessage;
  }
  // Fallback for unexpected error types
  return error?.message || "An unknown error occurred.";
};


// --- API Endpoint Definitions ---

export const api = {
  documents: {
    /** Get list of all documents */
    getAll: () => API.get('/documents'),
    /** Get details of a specific document */
    getOne: (filename) => API.get(`/documents/${filename}`),
    /** Upload a document */
    upload: (file, onUploadProgress = () => {}) => {
      const formData = new FormData();
      formData.append('file', file);
      console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
      return API.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // Increase timeout for uploads (120 seconds)
        onUploadProgress: (progressEvent) => {
          try {
            if (progressEvent?.loaded && progressEvent?.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onUploadProgress(percentCompleted);
            } else {
              onUploadProgress(-1); // Indicate indeterminate progress
            }
          } catch (err) {
            console.error("Error in upload progress callback:", err);
          }
        }
      });
    },
    /** Delete a document and associated data */
    delete: (filename) => API.delete(`/documents/${filename}`),
  },

  chat: {
    /** Ask a question about a specific document */
    askQuestion: (filename, question) =>
      API.post('/chat', { filename, question }),
    /** Get chat history for a document */
    getHistory: (filename) =>
      API.get(`/chat/history/${filename}`),
  },

  notes: {
    /** Generate study notes for a document/topic */
    generate: (filename, topic = '') =>
      API.post('/notes', { filename, topic }),
    /** Get all generated study notes */
    getAll: () => API.get('/notes'),
    /** Get a specific study note by ID */
    getOne: (noteId) => API.get(`/notes/${noteId}`),
    /** Delete a specific study note */
    delete: (noteId) => API.delete(`/notes/${noteId}`),
  },

  flashcards: {
    /** Generate flashcards for a document/topic */
    generate: (filename, topic, numCards = 10) =>
      API.post('/flashcards', { filename, topic, num_cards: numCards }), // Match backend param name
    /** Get all flashcard decks */
    getAll: () => API.get('/flashcards'),
    /** Get a specific flashcard deck by ID */
    getOne: (deckId) => API.get(`/flashcards/${deckId}`),
    /** Delete a specific flashcard deck */
    delete: (deckId) => API.delete(`/flashcards/${deckId}`),
  },

  mindMaps: {
    /** Generate a mind map for a document/topic */
    generate: (filename, topic) =>
      API.post('/mindmaps', { filename, topic }),
    /** Get all generated mind maps */
    getAll: () => API.get('/mindmaps'),
    /** Get a specific mind map by ID */
    getOne: (mapId) => API.get(`/mindmaps/${mapId}`),
    /** Delete a specific mind map */
    delete: (mapId) => API.delete(`/mindmaps/${mapId}`),
  },

  tests: {
    /** Generate a test for a document/topic */
    generate: (filename, topic, difficulty = 'Medium') =>
      API.post('/tests', { filename, topic, difficulty }),
    /** Get all generated tests */
    getAll: () => API.get('/tests'),
    /** Get a specific test by ID */
    getOne: (testId) => API.get(`/tests/${testId}`),
    /** Delete a specific test */
    delete: (testId) => API.delete(`/tests/${testId}`),
  },

  roadmaps: {
    /** Generate a study roadmap */
    generate: (params) => API.post('/roadmaps', params), // Pass params object directly
    /** Get all generated roadmaps */
    getAll: () => API.get('/roadmaps'),
    /** Get a specific roadmap by ID */
    getOne: (roadmapId) => API.get(`/roadmaps/${roadmapId}`),
    /** Delete a specific roadmap */
    delete: (roadmapId) => API.delete(`/roadmaps/${roadmapId}`),
  },

  dsa: {
    /** Get DSA questions with optional filters */
    getQuestions: (filters = {}) => API.get('/dsa/questions', { params: filters }),
    /** Mark a DSA question as solved */
    markAsSolved: (questionId) => API.post(`/dsa/questions/${questionId}/solve`),
    /** Mark a DSA question as unsolved */
    markAsUnsolved: (questionId) => API.post(`/dsa/questions/${questionId}/unsolve`), // Corrected endpoint
    /** Add a DSA question to favorites */
    addToFavorites: (questionId) => API.post(`/dsa/questions/${questionId}/favorite`),
    /** Remove a DSA question from favorites */
    removeFromFavorites: (questionId) => API.post(`/dsa/questions/${questionId}/unfavorite`),
    /** Analyze user's code solution for a problem */
    analyzeCode: (problemId, code, language) =>
      API.post('/dsa/code/analyze', { problem_id: problemId, code, language }), // Match backend params
    /** Generate a personalized DSA study plan */
    createPersonalizedPlan: (params) => API.post('/dsa/personalized-plan', params),
    /** Get user's DSA progress metrics */
    getProgress: () => API.get('/dsa/progress'),
    /** Initiate a mock interview session */
    createMockInterview: (params) => API.post('/dsa/mock-interview', params),
    /** Get coding pattern hints for a specific problem */
    getPatternHints: (problemId) => API.post('/dsa/pattern-hints', { problem_id: problemId }), // Match backend params
  }
};

// Export the api object as the default export
export default api;
