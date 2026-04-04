import os
import requests
import base64
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

CVENT_CLIENT_ID = os.getenv("CVENT_CLIENT_ID")
CVENT_CLIENT_SECRET = os.getenv("CVENT_CLIENT_SECRET")

auth_str = f"{CVENT_CLIENT_ID}:{CVENT_CLIENT_SECRET}"
b64_auth = base64.b64encode(auth_str.encode()).decode()
url = "https://api-platform.cvent.com/ea/oauth2/token"
headers = {"Authorization": f"Basic {b64_auth}", "Content-Type": "application/x-www-form-urlencoded"}

res = requests.post(url, headers=headers, data={"grant_type": "client_credentials"})
res.raise_for_status()
token = res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}",  "Accept": "application/json"}
endpoint = "https://api-platform.cvent.com/ea/events"
params = {"limit": 200}

r = requests.get(endpoint, headers=headers, params=params)
if r.ok:
    data = r.json()
    events = data.get("data", [])
    print(f"Total returned raw events from Cvent GET: {len(events)}")
    
    target_date = "2026-07-01T00:00:00Z"
    matched_events = []
    
    for ev in events:
        start = ev.get("eventStartDate", "")
        if start and start >= target_date:
            matched_events.append(ev)
            
    print(f"\nEvents after July 2026: {len(matched_events)}")
    for idx, m in enumerate(matched_events):
        print(f" {idx+1}. {m.get('title', 'Unknown')} ({m.get('eventStartDate')}) - ID: {m.get('id')}")
else:
    print(f"Error fetching GET events: {r.text}")
