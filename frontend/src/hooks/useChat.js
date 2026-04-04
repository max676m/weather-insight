import { useState } from 'react';

const SLIDING_WINDOW_LIMIT = 6;

export function useChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can help you find events in Cvent. Where and when would you like to look?', events: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (userText) => {
    if (!userText.trim()) return;

    const newUserMsg = { role: 'user', text: userText };
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setLoading(true);
    setError(null);

    // Apply Sliding Window: Take the last N messages
    const windowedMessages = updatedMessages.slice(-SLIDING_WINDOW_LIMIT);

    try {
      const response = await fetch('/api/events/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: windowedMessages })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      const newAssistantMsg = { 
        role: 'assistant', 
        text: data.text || "Here is what I found:", 
        events: data.events || null 
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', text: 'Sorry, I encountered an error connecting to the AI services.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
