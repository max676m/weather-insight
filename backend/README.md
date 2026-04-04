# Weather API Backend Service

## Architecture Overview
This directory contains a lightweight **Node.js Express** proxy service. It serves as the primary gateway for the Weather Insight application, handling client requests for weather data, authenticating them, and aggregating external data streams before sending a unified JSON response back to the client.

### Who calls this service?
This service is called directly by the **React Frontend** whenever a user requests weather data for a specific location. By placing it behind a server proxy, we prevent exposing raw API keys on the client-side.

### Who does this service call?
This service acts as an aggregator. For a single client request, it makes two downstream network calls:
1. **WeatherAPI.com:** Fetches real-time climate and air quality data.
2. **AI Facts Service (`http://localhost:8000`):** Calls our internal Python metadata service to dynamically generate exactly 3 interesting AI facts about the queried location.

## Code Breakdown & Key Methods

### 1. Unified Endpoint (`/api/location-info`)
The core functionality lives entirely within `server.js` at the `GET /api/location-info` route. 

It starts by enforcing authentication via `authMiddleware` before taking the `location` query parameter and fetching the external APIs.

```javascript
app.get('/api/location-info', authMiddleware, async (req, res) => {
    // Fetches from WeatherAPI
    const weatherRes = await fetch(weatherUrl);
    
    // Fetches from Python AI service
    const aiRes = await fetch(`${AI_SERVICE_URL}/generate-facts`, ...);
```

### 2. Graceful Degradation
To ensure high availability, the backend is written to **gracefully degrade**. If the Python AI service crashes or times out, a `try/catch` block seamlessly intercepts the error and returns the core weather parameters without facts, preventing total request failure.

```javascript
    } catch (aiErr) {
      console.error('AI service unreachable:', aiErr.message);
      // Gracefully degrade — return weather without facts
    }
```

### 3. Firebase Authentication Middleware
The `middleware/authMiddleware.js` verifies the incoming `Bearer` token against Firebase Admin, heavily securing the proxy from unauthorized automated scraping.
