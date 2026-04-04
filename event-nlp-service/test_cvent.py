import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

CVENT_CLIENT_ID = os.getenv("CVENT_CLIENT_ID")
CVENT_CLIENT_SECRET = os.getenv("CVENT_CLIENT_SECRET")

# File for clear output
with open("cvent_results.txt", "w") as f:
    f.write("Testing OData Filters...\n")

def log(msg):
    with open("cvent_results.txt", "a") as f:
        f.write(str(msg) + "\n")

auth_str = f"{CVENT_CLIENT_ID}:{CVENT_CLIENT_SECRET}"
b64_auth = base64.b64encode(auth_str.encode()).decode()
url = "https://api-platform.cvent.com/ea/oauth2/token"
headers = {"Authorization": f"Basic {b64_auth}", "Content-Type": "application/x-www-form-urlencoded"}

res = requests.post(url, headers=headers, data={"grant_type": "client_credentials"})
token = res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}",  "Accept": "application/json"}
endpoint = "https://api-platform.cvent.com/ea/events"

filters_to_test = [
    "created ge 2026-07-01T00:00:00Z",
    "eventStartDate ge 2026-07-01T00:00:00Z",
    "eventLaunchDate ge 2026-07-01",
    "createdAfter=2026-07-01",
    "eventStart ge 2026-07-01T00:00:00Z",
]

for f in filters_to_test:
    log(f"--- Filter: {f} ---")
    r = requests.get(endpoint, headers=headers, params={"filter": f})
    log(f"Status: {r.status_code}")
    if r.ok:
        data = r.json()
        log(f"Success! Found {len(data.get('data', []))} items.")
        for item in data.get('data', []):
            log(f" - {item.get('title')} | startDate: {item.get('eventStartDate')} | created: {item.get('created')}")
    else:
        log(f"Error: {r.json().get('message') if 'json' in r.headers.get('content-type', '') else r.text[:100]}")
    log("")
