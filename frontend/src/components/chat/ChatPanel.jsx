import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

export default function ChatPanel({ messages, loading, onSendMessage }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
            {msg.role === 'assistant' && <div className="chat-avatar">🤖</div>}
            <div className={`chat-bubble ${msg.role}`}>
              {msg.text}
            </div>
            {msg.role === 'user' && <div className="chat-avatar user-avatar">U</div>}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrapper assistant">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble assistant typing">...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Ask for an event..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
