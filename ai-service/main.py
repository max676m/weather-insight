import os
import json
import requests
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

app = FastAPI(title="Weather Insight AI Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class FactRequest(BaseModel):
    location: str

class FactResponse(BaseModel):
    facts: list[str]

@app.post("/generate-facts", response_model=FactResponse)
def generate_facts(req: FactRequest):
    location = req.location.strip()
    if not location:
        raise HTTPException(status_code=400, detail="Location is required.")

    if not GOOGLE_GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GOOGLE_GEMINI_API_KEY not configured.")

    prompt = (
        f"Generate exactly 3 short, informative facts about {location}.\n"
        "Rules:\n"
        "1. The first two facts must be positive — highlight strengths, attractions, or notable achievements.\n"
        "2. The third fact must be negative or challenging — highlight a real issue or drawback.\n"
        "3. Each fact must be a single sentence, under 25 words.\n"
        "4. Return ONLY a JSON array of 3 strings, no other text.\n"
        'Example: ["Fact one.", "Fact two.", "Fact three."]\n'
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            
            # Gemini response structure extraction
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
                text = text.rsplit("```", 1)[0].strip()

            facts = json.loads(text)

            if not isinstance(facts, list) or len(facts) != 3:
                 raise ValueError("Expected a JSON array of exactly 3 strings.")

            return FactResponse(facts=facts)

        except (json.JSONDecodeError, KeyError, IndexError, ValueError) as e:
            raise HTTPException(status_code=500, detail=f"AI returned invalid/unexpected response: {e}")
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429 and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Backoff
                continue
            raise HTTPException(status_code=500, detail=f"Google API Error: {response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok"}
