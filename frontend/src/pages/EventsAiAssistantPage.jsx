import React from 'react';
import Header from '../components/Header';
import { useChat } from '../hooks/useChat';
import ChatPanel from '../components/chat/ChatPanel';
import ResultsPanel from '../components/chat/ResultsPanel';
import './EventsAiAssistantPage.css';

export default function EventsAiAssistantPage() {
  const { messages, loading, sendMessage } = useChat();

  return (
    <div className="app">
      {/* Background blobs */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      
      <Header />
      
      <div className="page-subtitle">
        <p>Find your next Cvent event effortlessly using AI</p>
      </div>

      <div className="event-ai-container">
        <aside className="event-ai-sidebar">
          <ChatPanel messages={messages} loading={loading} onSendMessage={sendMessage} />
        </aside>
        
        <main className="event-ai-main">
          {/* We display results based on the last message's events payload if any */}
          <ResultsPanel messages={messages} loading={loading} />
        </main>
      </div>
      
    </div>
  );
}
