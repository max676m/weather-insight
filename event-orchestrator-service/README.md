# Event Orchestrator Service

## Architecture Overview
The **Event Orchestrator Service** is built using **Node.js (Express)**. In contrast to standard databases, this proxy service uses LLMs (Language Learning Models) to extract metadata parameters from conversational user inputs organically. Because of the host's Node 16 environment limitations, we sidestepped modern AI agents (like `@mastra/core`) and implemented custom native `fetch` wrappers communicating directly with Gemini APIs. 

### Who calls this service?
It is called by the **React Frontend** chat panel via a `POST` request to `/api/events/chat` every time the user sends a new chat message.

### Who does this service call?
Once a conversational prompt array is received, it queries the **Google Gemini API** (`generativelanguage.googleapis.com`) to extract date arrays, locations, and keywords. Afterwards, it immediately routes those parsed explicit constraints down to the **Python Event NLP Service** (running locally on port 8001).

## Code Breakdown & Key Methods

### 1. Session Logging (Observability)
A custom file appender logs the state machine sequence. Because stateful chatbots are intrinsically opaque, a robust `chat_sessions.log` local log traces how parameters are extracted, dropped, transformed, or evaluated throughout execution.

```javascript
const logFile = path.join(__dirname, 'chat_sessions.log');
function logSession(sessionId, action, data) {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), sessionId, action, data }) + '\n';
    fs.appendFile(logFile, entry, (err) => { /*...*/ });
}
```

### 2. Conversational Payload Extraction
The primary route strips out complex chat histories and tasks Google Gemini with outputting a strict structured JSON matching criteria. It parses dynamic NLP elements (e.g. converting "next month" to an ISO representation based on the current date instructions).

```javascript
        const promptText = `
You are an event assistant. Extract search parameters from the user's conversation.
Use ISO dates (YYYY-MM-DD). If missing exact dates, default to upcoming 2 years...
Return EXACTLY a JSON string with keys: 'response_text', 'should_search', 'startDate', 'endDate', 'location', 'keywords'.
...
        `;
```

### 3. Dual-Network Merging
Once the AI provides parameters, the service makes a secondary network hop down to the Python backend to resolve the actual matching events. If the LLM returns arrays instead of target strings, it normalizes arrays down to strings to prevent Python HTTP Unprocessable Entity panics.

```javascript
        // Snippet normalizing AI extraction for the Python microservice downstream
        const pyRes = await fetch("http://localhost:8001/score-events", {
            method: "POST",
            body: JSON.stringify({
                location: Array.isArray(parsed.location) ? parsed.location.join(' ') : parsed.location,
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords.join(' ') : parsed.keywords
            })
        });
```
