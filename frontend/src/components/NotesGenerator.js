import React, { useState, useEffect } from 'react';
import { notes } from '../api';

function NotesGenerator({ currentDocument }) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userNotes, setUserNotes] = useState([]);
  const [error, setError] = useState(null);

  // Fetch saved notes when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await notes.getAll();
        setUserNotes(Object.entries(response.data).map(([id, note]) => ({
          id,
          ...note
        })));
      } catch (err) {
        setError('Failed to fetch saved notes');
        console.error(err);
      }
    };

    fetchNotes();
  }, []);

  const handleGenerateNotes = async () => {
    if (!currentDocument) {
      setError('Please select a document first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await notes.generate(currentDocument.filename, topic);
      
      // Add the new note to the list
      const newNote = {
        id: response.data.note_id,
        ...response.data.notes
      };
      
      setUserNotes([newNote, ...userNotes]);
      setTopic(''); // Clear the topic input
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate notes');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notes.delete(noteId);
      setUserNotes(userNotes.filter(note => note.id !== noteId));
    } catch (err) {
      setError('Failed to delete note');
      console.error(err);
    }
  };

  const handleDownload = (note) => {
    const element = document.createElement('a');
    const file = new Blob([note.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${note.topic.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="notes-generator">
      <h2>Study Notes Generator</h2>
      
      {!currentDocument && (
        <div className="warning-message">
          Please select a document first to generate notes.
        </div>
      )}

      <div className="generator-controls">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic for your notes (leave blank for full summary)"
          disabled={!currentDocument || isGenerating}
        />
        <button
          onClick={handleGenerateNotes}
          disabled={!currentDocument || isGenerating}
          className="primary-button"
        >
          {isGenerating ? 'Generating...' : 'Generate Notes'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="notes-list">
        <h3>Your Study Notes</h3>
        {userNotes.length === 0 ? (
          <p>No notes generated yet. Use the form above to create study notes.</p>
        ) : (
          userNotes.map(note => (
            <div key={note.id} className="note-card">
              <h4>{note.topic}</h4>
              <div className="note-metadata">
                <span>Document: {note.document}</span>
                <span>Created: {new Date(note.created_at).toLocaleString()}</span>
              </div>
              <div className="note-content">
                {/* Use a markdown parser in a real application */}
                <pre>{note.content.substring(0, 200)}...</pre>
              </div>
              <div className="note-actions">
                <button onClick={() => handleDownload(note)}>Download</button>
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotesGenerator;
