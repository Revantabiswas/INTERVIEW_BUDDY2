import React, { useState, useEffect, useRef } from 'react';
import { chat } from '../api';

function ChatInterface({ currentDocument }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch chat history when document changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (currentDocument) {
        try {
          const response = await chat.getHistory(currentDocument.filename);
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to fetch chat history:', error);
        }
      } else {
        setMessages([]);
      }
    };

    fetchChatHistory();
  }, [currentDocument]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentDocument) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setIsLoading(true);
    setInputMessage('');

    try {
      // Send message to API
      const response = await chat.askQuestion(inputMessage, currentDocument.filename);
      
      // Add AI response to chat
      setMessages(response.data.history);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      setMessages([
        ...messages, 
        userMessage,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start a conversation about your document!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={currentDocument ? "Ask about your document..." : "Please select a document first"}
          disabled={!currentDocument || isLoading}
        />
        <button 
          type="submit" 
          disabled={!currentDocument || !inputMessage.trim() || isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
