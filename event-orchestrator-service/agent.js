const webStreams = require('node:stream/web');
if (webStreams) {
  globalThis.TransformStream = webStreams.TransformStream;
  globalThis.ReadableStream = webStreams.ReadableStream;
  globalThis.WritableStream = webStreams.WritableStream;
}
globalThis.fetch = require('node-fetch');
globalThis.Request = globalThis.fetch.Request;
globalThis.Response = globalThis.fetch.Response;
globalThis.Headers = globalThis.fetch.Headers;

const { Agent } = require('@mastra/core');
const { createTool } = require('@mastra/core/tools');

// Create the Tool that will talk to our python event-nlp-service
const fetchAndScoreEventsTool = createTool({
    id: "FetchAndScoreEvents",
    description: "Fetch events from the Python NLP service. Takes in target date ranges and descriptive filters to search for.",
    inputSchema: {
        type: "object",
        properties: {
            startDate: { type: "string", description: "Start date in ISO format, e.g. 2026-04-10" },
            endDate: { type: "string", description: "End date in ISO format, e.g. 2026-04-20" },
            location: { type: "string", description: "Target city or location" },
            keywords: { type: "string", description: "Any remaining descriptive keywords like 'tech', 'networking'" }
        },
        required: ["startDate", "endDate"]
    },
    execute: async ({ context }) => {
        try {
            console.log("Calling python NLP service with:", context);
            const res = await fetch("http://localhost:8001/score-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(context)
            });
            if (!res.ok) {
                return { error: 'Failed to fetch events from Python service' };
            }
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error calling Python API:", error);
            return { error: error.message };
        }
    }
});

const chatAgent = new Agent({
    name: "CventEventAssistant",
    instructions: `You are a helpful event finding assistant. 
1. The user will ask for events. Extract 'startDate', 'endDate', 'location', and 'keywords' from their query. 
2. If you don't have enough information (like a general date range), ask the user for clarity. Do not guess.
3. If you have enough info, use the 'FetchAndScoreEvents' tool to get the matches.
4. Present the events to the user beautifully, mentioning their Match Percentage (e.g. 92% Match).`,
    model: {
        provider: "google",
        name: "gemini-2.5-flash"
    },
    tools: {
        fetchAndScore: fetchAndScoreEventsTool
    }
});

module.exports = {
    chatAgent
};
