const request = require('supertest');
const app = require('../server');

// Mock external services to isolate tests (no real network calls)
jest.mock('node-fetch');
const fetch = require('node-fetch');

jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    // If auth header is "Bearer VALID", pretend verification passed
    if (req.headers.authorization === 'Bearer VALID') {
      req.uid = 'testUid';
      return next();
    }
    // Otherwise 401
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  };
});

describe('Backend API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/location-info', () => {
    it('fails if not authenticated', async () => {
      const res = await request(app).get('/api/location-info?location=London');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('fails if location parameter is missing', async () => {
      const res = await request(app)
        .get('/api/location-info')
        .set('Authorization', 'Bearer VALID');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing "location"/);
    });

    it('returns combined weather and AI facts successfully', async () => {
      const weatherMockResponse = {
        location: { name: 'London', country: 'UK' },
        current: {
          temp_c: 12,
          condition: { text: 'Sunny' },
          humidity: 50,
          wind_kph: 10,
          air_quality: { pm2_5: 5.5, pm10: 10.2 }
        }
      };

      const aiMockResponse = {
        facts: ['Fact 1', 'Fact 2', 'Fact 3']
      };

      // Mock node-fetch implementation
      fetch.mockImplementation((url) => {
        if (url.includes('weatherapi.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(weatherMockResponse)
          });
        }
        if (url.includes('generate-facts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(aiMockResponse)
          });
        }
        return Promise.reject(new Error('Unknown URL mocked'));
      });

      const res = await request(app)
        .get('/api/location-info?location=London')
        .set('Authorization', 'Bearer VALID');

      expect(res.status).toBe(200);
      expect(res.body.location).toBe('London');
      expect(res.body.country).toBe('UK');
      expect(res.body.weather.temperature_c).toBe(12);
      expect(res.body.facts).toEqual(['Fact 1', 'Fact 2', 'Fact 3']);
    });

    it('returns 502 if Weather API fails', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('weatherapi.com')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            text: () => Promise.resolve('Bad Request')
          });
        }
      });

      const res = await request(app)
        .get('/api/location-info?location=UnknownCity')
        .set('Authorization', 'Bearer VALID');

      expect(res.status).toBe(502);
      expect(res.body.error).toMatch(/Failed to fetch weather/);
    });

    it('gracefully degrades if AI service fails', async () => {
      // Mock node-fetch implementation
      fetch.mockImplementation((url) => {
        if (url.includes('weatherapi.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ location: { name: 'London' }, current: {} })
          });
        }
        if (url.includes('generate-facts')) {
          return Promise.reject(new Error('AI Service Down'));
        }
      });

      const res = await request(app)
        .get('/api/location-info?location=London')
        .set('Authorization', 'Bearer VALID');

      expect(res.status).toBe(200);
      // AI facts should just default to empty array
      expect(res.body.facts).toEqual([]);
    });

    it('returns 500 if an unexpected fatal error occurs', async () => {
      fetch.mockImplementation(() => {
        return Promise.reject(new Error('Unexpected Fatal Error'));
      });
      const res = await request(app)
        .get('/api/location-info?location=London')
        .set('Authorization', 'Bearer VALID');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
