import os
import pytest
import responses
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Verify the health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_missing_location():
    """Verify 400 Bad Request when location is empty."""
    response = client.post("/generate-facts", json={"location": "   "})
    assert response.status_code == 400
    assert "Location is required" in response.text

def test_missing_api_key(monkeypatch):
    """Verify 503 when API key is missing."""
    monkeypatch.setattr("main.GOOGLE_GEMINI_API_KEY", None)
    response = client.post("/generate-facts", json={"location": "Tokyo"})
    assert response.status_code == 503
    assert "GOOGLE_GEMINI_API_KEY not configured" in response.text

@responses.activate
def test_successful_fact_generation():
    """Verify successful parsing of Gemini payload."""
    mock_payload = {
        "candidates": [{
            "content": {
                "parts": [{"text": '```json\n["Fact 1", "Fact 2", "Fact 3"]\n```'}]
            }
        }]
    }
    
    responses.add(
        responses.POST,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=mock_key",
        json=mock_payload,
        status=200
    )
    
    monkeypatch_env = True
    app.dependency_overrides = {}
    
    import main
    original_key = main.GOOGLE_GEMINI_API_KEY
    main.GOOGLE_GEMINI_API_KEY = "mock_key"
    
    try:
        response = client.post("/generate-facts", json={"location": "Paris"})
        assert response.status_code == 200
        assert response.json()["facts"] == ["Fact 1", "Fact 2", "Fact 3"]
        
        # Test wrong array size to hit line 67
        responses.replace(responses.POST, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=mock_key", json={"candidates": [{"content": {"parts": [{"text": '["Fact 1"]'}]}}]}, status=200)
        res_bad = client.post("/generate-facts", json={"location": "Paris"})
        assert res_bad.status_code == 500
    finally:
        main.GOOGLE_GEMINI_API_KEY = original_key

@responses.activate
def test_invalid_json_from_ai():
    """Verify 500 when AI returns non-json or bad array."""
    mock_payload = {
        "candidates": [{
            "content": {
                "parts": [{"text": 'Not a json array'}]
            }
        }]
    }
    responses.add(
        responses.POST,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=mock_key",
        json=mock_payload,
        status=200
    )
    
    import main
    original_key = main.GOOGLE_GEMINI_API_KEY
    main.GOOGLE_GEMINI_API_KEY = "mock_key"
    try:
        response = client.post("/generate-facts", json={"location": "Paris"})
        assert response.status_code == 500
        assert "invalid/unexpected response" in response.text
    finally:
        main.GOOGLE_GEMINI_API_KEY = original_key

@responses.activate
def test_google_api_error():
    """Verify handling of Google API 400 HTTP errors."""
    responses.add(
        responses.POST,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=mock_key",
        body="Bad Request",
        status=400
    )
    
    import main
    original_key = main.GOOGLE_GEMINI_API_KEY
    main.GOOGLE_GEMINI_API_KEY = "mock_key"
    try:
        response = client.post("/generate-facts", json={"location": "Paris"})
        assert response.status_code == 500
        assert "Google API Error" in response.text
    finally:
        main.GOOGLE_GEMINI_API_KEY = original_key
