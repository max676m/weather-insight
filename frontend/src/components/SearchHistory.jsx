export default function SearchHistory({ history, onSelect }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="search-history">
      <p className="search-history__label">Recent Searches</p>
      <div className="search-history__chips">
        {history.map((location, i) => (
          <button
            key={i}
            className="search-history__chip"
            onClick={() => onSelect(location)}
            title={`Search for ${location} again`}
          >
            🕐 {location}
          </button>
        ))}
      </div>
    </div>
  );
}
