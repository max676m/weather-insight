require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/* ────────────────────────────────────────────
   GET /api/location-info?location=Paris
   ──────────────────────────────────────────── */
app.get('/api/location-info', async (req, res) => {
  const { location } = req.query;

  if (!location || !location.trim()) {
    return res.status(400).json({ error: 'Missing "location" query parameter.' });
  }

  try {
    /* 1 — Fetch weather data */
    const weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=yes`;
    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) {
      const body = await weatherRes.text();
      console.error('Weather API error:', weatherRes.status, body);
      return res.status(502).json({ error: 'Failed to fetch weather data.' });
    }

    const weatherData = await weatherRes.json();

    /* 2 — Fetch AI facts */
    let facts = [];
    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/generate-facts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: location.trim() }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        facts = aiData.facts || aiData;
      } else {
        console.error('AI service error:', aiRes.status);
      }
    } catch (aiErr) {
      console.error('AI service unreachable:', aiErr.message);
      // Gracefully degrade — return weather without facts
    }

    /* 3 — Build unified response */
    const loc = weatherData.location || {};
    const cur = weatherData.current || {};
    const aq = cur.air_quality || {};

    const unified = {
      location: loc.name || location,
      country: loc.country || '',
      weather: {
        temperature_c: cur.temp_c ?? null,
        condition: (cur.condition && cur.condition.text) || '',
        humidity: cur.humidity ?? null,
        wind_kph: cur.wind_kph ?? null,
      },
      air_quality: {
        pm2_5: aq.pm2_5 ?? null,
        pm10: aq.pm10 ?? null,
      },
      facts,
    };

    return res.json(unified);
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/* Health-check */
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ Backend API running → http://localhost:${PORT}`);
  if (!WEATHER_API_KEY) {
    console.warn('⚠️  WEATHER_API_KEY not set — weather calls will fail.');
  }
});
