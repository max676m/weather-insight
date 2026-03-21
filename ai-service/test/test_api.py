from fastapi.testclient import TestClient
from main import app
import os
import pytest

client = TestClient(app)

def test_health_check():
    """Verify the health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.skipif(not os.getenv("GOOGLE_GEMINI_API_KEY"), reason="Requires GOOGLE_GEMINI_API_KEY in .env")
def test_generate_facts():
    """Verify the AI integration hits Gemini and returns valid 3 facts for Tokyo."""
    response = client.post(
        "/generate-facts",
        json={"location": "Tokyo"}
    )
    assert response.status_code == 200, f"Error: {response.text}"
    
    data = response.json()
    assert "facts" in data
    assert isinstance(data["facts"], list)
    assert len(data["facts"]) == 3
    # Check that they are relatively short sentences as requested by the prompt rules
    for fact in data["facts"]:
        assert len(fact) > 5
