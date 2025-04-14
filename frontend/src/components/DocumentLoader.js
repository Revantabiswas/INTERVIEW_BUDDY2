import React, { useState, useEffect } from 'react';
import { documents } from '../api';

function DocumentLoader({ onDocumentSelect }) {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documents.getAll();
        setUploadedDocuments(response.data);
      } catch (err) {
        setError('Failed to load documents');
        console.error(err);
      }
    };

    fetchDocuments();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await documents.upload(selectedFile);
      // Add the new document to the list
      setUploadedDocuments([...uploadedDocuments, response.data.document]);
      // Clear the selected file
      setSelectedFile(null);
      // Reset file input
      document.getElementById('file-upload').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDocument = (document) => {
    setCurrentDocument(document);
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  return (
    <div className="document-loader">
      <h3>Upload Study Material</h3>
      <div className="upload-section">
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || isLoading}
          className="primary-button"
        >
          {isLoading ? 'Processing...' : 'Upload Document'}
        </button>
        {error && <p className="error">{error}</p>}
        {selectedFile && <p>Selected: {selectedFile.name}</p>}
      </div>

      {uploadedDocuments.length > 0 && (
        <div className="document-list">
          <h4>Your Documents</h4>
          <ul>
            {uploadedDocuments.map((doc) => (
              <li 
                key={doc.filename}
                className={currentDocument?.filename === doc.filename ? 'selected' : ''}
              >
                <button 
                  onClick={() => handleSelectDocument(doc)}
                  className="document-button"
                >
                  {doc.filename} ({doc.pages} pages)
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentDocument && (
        <div className="current-document">
          <p>
            Currently loaded: <strong>{currentDocument.filename}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentLoader;
