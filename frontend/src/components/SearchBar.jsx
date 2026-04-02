import { Search } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ value, onChange, className = '' }) {
  return (
    <div className={`search-bar ${className}`}>
      <label className="search-bar-field">
        <Search size={16} className="search-bar-icon" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search for dishes..."
          className="search-bar-input"
        />
      </label>
    </div>
  );
}
