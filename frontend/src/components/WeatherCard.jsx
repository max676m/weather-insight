import './WeatherCard.css';

function WeatherCard({ data }) {
  const { location, country, weather, air_quality } = data;

  const conditionEmoji = getConditionEmoji(weather.condition);

  return (
    <div className="weather-card" id="weather-card">
      <div className="weather-card__header">
        <div className="weather-card__location">
          <h2>{location}</h2>
          <span className="weather-card__country">{country}</span>
        </div>
        <span className="weather-card__emoji">{conditionEmoji}</span>
      </div>

      <div className="weather-card__temp">
        <span className="weather-card__temp-value">{weather.temperature_c}</span>
        <span className="weather-card__temp-unit">°C</span>
      </div>

      <p className="weather-card__condition">{weather.condition}</p>

      <div className="weather-card__details">
        <div className="weather-card__detail" id="detail-humidity">
          <span className="weather-card__detail-icon">💧</span>
          <span className="weather-card__detail-label">Humidity</span>
          <span className="weather-card__detail-value">{weather.humidity}%</span>
        </div>
        <div className="weather-card__detail" id="detail-wind">
          <span className="weather-card__detail-icon">💨</span>
          <span className="weather-card__detail-label">Wind</span>
          <span className="weather-card__detail-value">{weather.wind_kph} km/h</span>
        </div>
      </div>

      {air_quality && (
        <div className="weather-card__air">
          <h3 className="weather-card__air-title">🌫️ Air Quality</h3>
          <div className="weather-card__air-grid">
            <div className="weather-card__air-item" id="aq-pm25">
              <span className="weather-card__air-label">PM2.5</span>
              <span className="weather-card__air-value">{air_quality.pm2_5}</span>
            </div>
            <div className="weather-card__air-item" id="aq-pm10">
              <span className="weather-card__air-label">PM10</span>
              <span className="weather-card__air-value">{air_quality.pm10}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getConditionEmoji(condition) {
  const c = condition.toLowerCase();
  if (c.includes('sun') || c.includes('clear')) return '☀️';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('fog') || c.includes('mist')) return '🌫️';
  if (c.includes('wind')) return '💨';
  return '🌡️';
}

export default WeatherCard;
