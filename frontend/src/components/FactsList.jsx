import './FactsList.css';

function FactsList({ facts, location }) {
  return (
    <div className="facts-list" id="facts-list">
      <h2 className="facts-list__title">
        <span className="facts-list__icon">✨</span> AI Insights — {location}
      </h2>
      <ul className="facts-list__items">
        {facts.map((fact, i) => {
          const isNegative = i === facts.length - 1; // last fact is negative per spec
          return (
            <li
              key={i}
              className={`facts-list__item ${isNegative ? 'facts-list__item--negative' : 'facts-list__item--positive'}`}
              id={`fact-${i}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <span className="facts-list__badge">
                {isNegative ? '⚠️' : '✅'}
              </span>
              <p>{fact}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FactsList;
