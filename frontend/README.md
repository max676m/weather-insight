# React Frontend Application

## Architecture Overview
The **Frontend** repository utilizes **React + Vite** and uses standard modular CSS. It acts as the interactive presentation layer for end-users, encompassing two main features: a weather summary screen highlighting dynamic 2D canvas effects, and an interactive "Chat UI" for semantic event searches. 

### Who calls this service?
This is a standard Single-Page Application (SPA) delivered to web browsers, and is inherently the end-of-the-chain calling point for the entire application.

### Who does this service call?
The Vite proxy routes differing functional requests to isolated backends to circumvent CORS blocks:
- Weather fetches hit the **Node Proxy (`/api/location-info`)** port `3001`.
- Events AI Chat commands hit the **Event Orchestrator Node Proxy (`/api/events`)** port `3002`.

## Code Breakdown & Key Components

### 1. Sliding Window Chat Hook (`useChat.js`)
To circumvent token explosions when feeding huge message histories into external LLMs, the central state relies on a custom `useChat` react hook. The array memory explicitly caps history bounding at 6 messages, preserving context while avoiding unnecessary API cost bandwidth limits.

```javascript
export function useChat() {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (text) => {
    // Sliding window boundary mapping
    const payloadMessages = messages.slice(-5).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));
    payloadMessages.push({ role: 'user', text });
  // ... Execute fetch
```

### 2. Events AI Assistant Layout (`EventsAiAssistantPage.jsx`)
Splits the view physically and semantically into two responsive panes: `ChatPanel` (tracking continuous history interactions) and `ResultsPanel` (mapping Event schema into responsive visual UI cards). 

```javascript
function EventsAiAssistantPage() {
  const { messages, events, isLoading, sendMessage } = useChat();

  return (
    <div className="events-assistant-page">
      <ChatPanel messages={messages} onSend={sendMessage} isLoading={isLoading} />
      <ResultsPanel events={events} isLoading={isLoading} />
    </div>
  );
}
```

### 3. Canvas Driven Interaction (`ExperimentsPage.jsx`)
Aside from semantic UI, it explores highly performant visual text-reflow tracking through a 2D native Canvas wrapper, demonstrating alternative architectures (like ignoring the DOM in favor of direct pixel writes for typography).
