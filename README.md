# Interview Buddy AI

![Interview Buddy AI](frontend/public/placeholder-logo.svg)

A comprehensive AI-powered interview preparation platform designed to help users practice and excel in technical interviews through personalized study paths, mock interviews, and real-time feedback.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Project Structure](#project-structure)
- [Features in Detail](#features-in-detail)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

Interview Buddy AI is a full-stack application designed to help job seekers prepare for technical interviews in the software development industry. The platform leverages AI to provide personalized learning experiences, simulate realistic interview scenarios, and track user progress over time.

## Features

- **AI-powered Chat Interface**: Engage in conversations with an AI tutor to clarify concepts and get guidance
- **Study Roadmaps**: Personalized learning paths based on your current skill level and target job roles
- **Document Processing**: Upload and analyze technical documents and interview prep materials
- **DSA Practice**: Practice data structures and algorithms problems with AI-guided solutions
- **Flashcards**: Create and review flashcards for quick knowledge recall
- **Mind Maps**: Visualize complex concepts and their relationships
- **Practice Tests**: Test your knowledge through custom quizzes and assessments
- **Study Notes**: Store and organize your study notes with AI-powered suggestions
- **Progress Tracking**: Monitor your improvement over time with detailed analytics

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- LangChain for AI integration
- SQLite/PostgreSQL for data storage
- Vector databases for semantic search

### Frontend
- Next.js 14
- React
- Tailwind CSS
- Framer Motion for animations
- Shadcn UI components

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm/pnpm
- Git

### Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Interview
   ```

2. Set up a Python virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   GROQ_API_KEY=your_api_key
   DEBUG=True
   ```

5. Start the backend server:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   ```
   The API server will run at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   # or if using pnpm
   pnpm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the `frontend` directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   pnpm dev
   ```

5. Access the application at `http://localhost:3000`

## Project Structure

```
Interview/
├── backend/
│   ├── agents.py           # AI agent implementations
│   ├── app.py              # FastAPI application setup
│   ├── config.py           # Configuration settings
│   ├── main.py             # Application entry point
│   ├── models/             # Data models and schemas
│   ├── routers/            # API route definitions
│   ├── storage/            # Data storage directories
│   └── utils.py            # Utility functions
│
├── frontend/
│   ├── app/                # Next.js application routes
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── public/             # Static assets
│   └── styles/             # CSS styles
```

## Features in Detail

### AI Chat Interface
The AI chat feature provides an interactive conversation experience with our AI tutor. Users can ask questions about programming concepts, interview strategies, or request help with specific problems.

**Usage**: Navigate to `/ai-chat` to start conversing with the AI assistant.

### Study Roadmaps
Personalized learning paths generated based on user skill assessment and target job roles. Each roadmap includes recommended topics, resources, and timelines.

**Usage**: Visit `/study-roadmap` to create and view your personalized roadmaps.

### Document Upload & Processing
Upload technical documentation, interview guides, or study materials. The system processes and indexes these documents for later reference and incorporates their content into AI responses.

**Usage**: Go to `/document-upload` to manage your study documents.

### DSA Practice
Practice data structures and algorithms with an extensive collection of problems ranging from easy to hard difficulty. Receive AI-guided hints and solutions.

**Usage**: Access `/dsa-practice` to start solving problems.

### Flashcards
Create, organize, and review flashcards for quick knowledge recall. The spaced repetition system optimizes your learning efficiency.

**Usage**: Visit `/flashcards` to manage your flashcard decks.

### Mind Maps
Visualize concept relationships through interactive mind maps. Create your own maps or have the AI generate them from your study materials.

**Usage**: Navigate to `/mind-maps` to work with mind maps.

### Practice Tests
Test your knowledge through customized assessments. Each test adapts to your skill level to provide the most effective learning experience.

**Usage**: Go to `/practice-tests` to take assessments.

### Study Notes
Organize and manage your study notes with AI-powered suggestions for improvement and expansion.

**Usage**: Access `/study-notes` to manage your notes.

### Progress Tracking
Monitor your learning journey with comprehensive analytics. Track time spent studying, problem-solving performance, and knowledge retention metrics.

**Usage**: View your progress statistics through the main dashboard.

## API Documentation

Once the backend server is running, you can access the interactive API documentation at `http://localhost:8000/docs`.

Key API endpoints include:

- `/api/chat`: Interact with the AI assistant
- `/api/documents`: Manage document uploads and processing
- `/api/roadmaps`: Create and retrieve study roadmaps
- `/api/dsa`: Access DSA problems and solutions
- `/api/flashcards`: Manage flashcard collections
- `/api/mindmaps`: Generate and retrieve mind maps
- `/api/tests`: Create and take practice tests
- `/api/notes`: Manage study notes
- `/api/progress`: Retrieve learning progress data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Created By Revanta Biswas 
© 2025 Interview Buddy AI - Your AI-powered interview preparation companion
