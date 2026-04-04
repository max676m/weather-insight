require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'chat_sessions.log');
function logSession(sessionId, action, data) {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), sessionId, action, data }) + '\n';
    fs.appendFile(logFile, entry, (err) => {
        if (err) console.error("Failed to write log", err);
    });
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.post('/api/events/chat', async (req, res) => {
    try {
        const { messages, sessionId: providedSessionId } = req.body;
        const sessionId = providedSessionId || 'session_' + Date.now();
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        logSession(sessionId, 'USER_REQUEST', { messages });

        const promptText = `
You are an event assistant. Extract search parameters from the user's conversation.
Use ISO dates (YYYY-MM-DD). If missing exact dates, default to upcoming 2 years (e.g. 2026-04-05 to 2028-04-05). 
Return EXACTLY a JSON string with keys: 'response_text' (your polite conversational reply), 'should_search' (boolean indicating if they provided enough intent to search), 'startDate', 'endDate', 'location', 'keywords'.
Conversation:
${messages.map(m => m.role + ': ' + m.text).join('\n')}
`;
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error(errBody);
            logSession(sessionId, 'GEMINI_ERROR', { error: errBody });
            return res.status(500).json({ error: 'Error calling Gemini API' });
        }
        
        const geminiData = await geminiRes.json();
        const outputJsonStr = geminiData.candidates[0].content.parts[0].text;
        
        // Remove potential markdown code blockers around the JSON output
        const cleanJsonStr = outputJsonStr.replace(/^```json/g, '').replace(/```$/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        logSession(sessionId, 'AI_PARSED_INTENT', parsed);

        let events = null;
        // If we should search and have dates, call Python API
        if (parsed.should_search && parsed.startDate && parsed.endDate) {
            const pyRes = await fetch("http://localhost:8001/score-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate: parsed.startDate,
                    endDate: parsed.endDate,
                    location: Array.isArray(parsed.location) ? parsed.location.join(' ') : (parsed.location || null),
                    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.join(' ') : (parsed.keywords || null)
                })
            });
            if (pyRes.ok) {
                events = await pyRes.json();
                logSession(sessionId, 'PYTHON_API_HIT_SUCCESS', { count: events.length });
            } else {
                const pyErr = await pyRes.text();
                console.error("Python API failed:", pyErr);
                logSession(sessionId, 'PYTHON_API_ERROR', { error: pyErr });
            }
        }

        logSession(sessionId, 'FINAL_RESPONSE', { text: parsed.response_text, events });
        return res.json({ text: parsed.response_text, events: events, sessionId });
    } catch (error) {
        console.error('Error handling chat:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`🚀 Event Orchestrator Service running natively on port ${PORT}`);
});
