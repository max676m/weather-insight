import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import requests
import base64

# We will need scikit-learn for Cosine Similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

app = FastAPI(title="Event NLP Scoring Service")

# Cvent Config
CVENT_CLIENT_ID = os.getenv("CVENT_CLIENT_ID")
CVENT_CLIENT_SECRET = os.getenv("CVENT_CLIENT_SECRET")

class ScoreEventsRequest(BaseModel):
    startDate: str
    endDate: str
    location: Optional[str] = None
    keywords: Optional[str] = None

class EventScoreResponse(BaseModel):
    id: str
    title: str
    location: str
    description: str
    match_score: float

def get_cvent_token():
    auth_str = f"{CVENT_CLIENT_ID}:{CVENT_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    url = "https://api.cvent.com/oauth2/token"
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    res = requests.post(url, headers=headers, data=data)
    res.raise_for_status()
    return res.json().get("access_token")

def fetch_events_from_cvent(start_date: str, end_date: str):
    mock_data = [
        {"id": "ev1", "title": "Tech Innovators Summit", "location": "New York", "description": "A networking event for tech professionals."},
        {"id": "ev2", "title": "Data Science Conference", "location": "San Francisco", "description": "Deep dive into machine learning..."},
        {"id": "ev3", "title": "NYC AI Mixer", "location": "New York", "description": "Casual networking for AI engineers..."},
    ]

    if not CVENT_CLIENT_ID or not CVENT_CLIENT_SECRET:
        print("Missing CVENT credentials, using mock data")
        return mock_data

    try:
        token = get_cvent_token()
        events_url = "https://api.cvent.com/events"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        payload = {
            "filter": f"createdAfter ge {start_date} AND createdBefore le {end_date}" 
        }
        res = requests.get(events_url, headers=headers, params=payload)
        
        if not res.ok:
            print(f"Cvent API returned {res.status_code}, falling back to mock. Error: {res.text}")
            return mock_data
            
        try:
            data = res.json()
        except ValueError:
            print(f"Cvent API returned non-JSON body. Status: {res.status_code}. Body snippet: {res.text[:1000]}")
            return mock_data
        
        mapped_events = []
        for item in data.get("data", []):
            mapped_events.append({
                "id": item.get("id"),
                "title": item.get("title", ""),
                "location": item.get("location", {}).get("city", "Unknown"),
                "description": item.get("description", "")
            })
            
        return mapped_events if mapped_events else mock_data
    except Exception as e:
        print(f"Cvent API failed: {e}. Falling back to mock events.")
        return mock_data

def compute_match_scores(events, target_location: Optional[str], target_keywords: Optional[str]):
    """
    Compute Cosine Similarity on Location + Keywords using TF-IDF.
    """
    if not events:
        return []

    # If no specific criteria, everything matches
    if not target_location and not target_keywords:
        return [{"event": e, "score": 100} for e in events]

    target_text = f"{target_location or ''} {target_keywords or ''}".lower().strip()

    # Combine event fields into search corpus
    corpus = [f"{e.get('location', '')} {e.get('title', '')} {e.get('description', '')}".lower() for e in events]
    corpus.append(target_text) # Target is the last element

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # The similarity of target against all events
    cosine_sim = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1])
    
    scored_events = []
    for idx, event in enumerate(events):
        score = round(cosine_sim[0][idx] * 100, 2)
        scored_events.append({"event": event, "score": score})

    return scored_events

@app.post("/score-events")
def score_events(req: ScoreEventsRequest):
    try:
        # 1. Fetch events by date
        events = fetch_events_from_cvent(req.startDate, req.endDate)

        # 2. Score matches in memory
        scored = compute_match_scores(events, req.location, req.keywords)

        # 3. Filter > 60% and get Top 3
        filtered = [s for s in scored if s["score"] >= 60.0]
        sorted_events = sorted(filtered, key=lambda x: x["score"], reverse=True)[:3]

        response = []
        for s in sorted_events:
            e = s["event"]
            response.append(EventScoreResponse(
                id=e["id"],
                title=e["title"],
                location=e["location"],
                description=e["description"],
                match_score=s["score"]
            ))

        return response
    except Exception as e:
        print(f"Error fetching/scoring events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
