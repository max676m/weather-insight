# Event NLP Service

## Architecture Overview
The **Event NLP Service** is a dedicated Python backend running on FastAPI. Rather than relying on rigid database keyword indexing, this service implements a generic **Natural Language Processing (NLP)** match-scoring engine via `scikit-learn` to filter corporate events dynamically. It pulls raw event listings from Cvent and scores them mathematically against user prompts.

### Who calls this service?
It is called strictly via intra-network traffic from our **Event Orchestrator Node.js Service** at the `/score-events` endpoint.

### Who does this service call?
The service acts as a bridge to external Enterprise databases, utilizing OAuth 2.0 to request `client_credential` token grants and then fetching raw Event metadata strictly from the **Cvent System API** (`api-platform.cvent.com`).

## Code Breakdown & Key Methods

The entire processing pipeline is contained within `main.py`.

### 1. OAuth & Data Aggregation
The service authenticates securely by generating a base64 encoded token from environment variables, before issuing a `GET` request to extract basic events. To avoid UI crashes when testing against inaccessible custom endpoints or non-JSON payloads, it includes a fallback to structural `mock_data`.

```python
def get_cvent_token():
    auth_str = f"{CVENT_CLIENT_ID}:{CVENT_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    # ... calls Cvent token URL
```

### 2. Natural Language Term Frequency Matcher
The heart of the service is `compute_match_scores`. Once events are fetched, it maps them into unified text documents (title + location + description) and ranks them using `TfidfVectorizer` and `cosine_similarity`. 

```python
def compute_match_scores(events: List[Dict], target_location: Optional[str], target_keywords: Optional[str]):
    # ... TF-IDF initialization ...
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(corpus)
    # ... Extract scores via cosine distance against the target user prompt
    cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
```

### 3. Threshold Filtration
Scores are scaled to percentages (0-100%). The backend strictly enforces a 60% relevance floor limit, dropping garbage events before they traverse back over the network to the Node layer.

```python
    filtered = [s for s in scored if s["score"] >= 60.0]
    return sorted(filtered, key=lambda x: x["score"], reverse=True)[:3]
```
