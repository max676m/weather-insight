# AI Facts Service

## Architecture Overview
The **AI Facts Service** is a microservice built with **Python FastAPI**. It is dedicated entirely to prompting Google's Gemini LLM to generate 3 localized facts about a given city or location. It features strict prompt engineering schemas and retry/backoff wrappers to parse generative AI responses cleanly into structured JSON.

### Who calls this service?
This service operates internally and is called exclusively by the **Weather API Backend Service** (`backend/server.js`) via the `/generate-facts` route. 

### Who does this service call?
The service executes external HTTP POST calls directly to the **Google Gemini REST API** (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`).

## Code Breakdown & Key Methods

The entirety of the logic lives in `main.py`.

### 1. Pydantic Models for Validation
The service enforces strict Input and Output contract definitions using fast, built-in Pydantic models.

```python
class FactRequest(BaseModel):
    location: str

class FactResponse(BaseModel):
    facts: list[str]
```

### 2. Prompt Engineering Schema
The `generate_facts` method constructs a very specific prompt forcing the LLM to output pure JSON without conversational fillers. It dictates that exactly two facts must be positive, and the third fact must highlight a negative drawback to provide objective contrast.

```python
    prompt = (
        f"Generate exactly 3 short, informative facts about {location}.\n"
        "1. The first two facts must be positive...\n"
        "2. The third fact must be negative...\n"
        "4. Return ONLY a JSON array of 3 strings, no other text."
    )
```

### 3. Network Fetch & Markdown Parsing
Because LLMs often randomly wrap JSON in markdown block ticks (```` ```json ````), the service employs string manipulation to safely strip wrappers and decode the output natively. A robust retry loop uses exponential backoff (handling HTTP `429 Too Many Requests`).

```python
    for attempt in range(max_retries):
        # Snippet: stripping markdown
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            text = text.rsplit("```", 1)[0].strip()
        facts = json.loads(text)
```
