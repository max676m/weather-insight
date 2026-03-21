import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from anthropic import Anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

app = FastAPI(title="Weather Insight AI Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class FactRequest(BaseModel):
    location: str


class FactResponse(BaseModel):
    facts: list[str]


@app.post("/generate-facts", response_model=FactResponse)
async def generate_facts(req: FactRequest):
    location = req.location.strip()
    if not location:
        raise HTTPException(status_code=400, detail="Location is required.")

    if not client:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured.")

    prompt = (
        f"Generate exactly 3 short, informative facts about {location}.\n"
        "Rules:\n"
        "1. The first two facts must be positive — highlight strengths, attractions, or notable achievements.\n"
        "2. The third fact must be negative or challenging — highlight a real issue or drawback.\n"
        "3. Each fact must be a single sentence, under 25 words.\n"
        "4. Return ONLY a JSON array of 3 strings, no other text.\n"
        'Example: ["Fact one.", "Fact two.", "Fact three."]\n'
    )

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=200,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            text = response.content[0].text.strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
                text = text.rsplit("```", 1)[0].strip()

            facts = json.loads(text)

            if not isinstance(facts, list) or len(facts) != 3:
                raise ValueError("Expected a JSON array of exactly 3 strings.")

            return FactResponse(facts=facts)

        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI returned invalid JSON.")
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(2 ** attempt)  # 1s, 2s backoff
                    continue
            raise HTTPException(status_code=500, detail=f"AI generation failed: {err_str}")


@app.get("/health")
async def health():
    return {"status": "ok"}
