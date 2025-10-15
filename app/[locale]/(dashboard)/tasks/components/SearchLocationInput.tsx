import React, { useState } from "react";

interface SearchLocationInputProps {
  onSelect: (item: { position: { lat: string; lon: string } }) => void;
}

const API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

const SearchLocationInput: React.FC<SearchLocationInputProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocationSuggestions = async (value: string) => {
    setLoading(true);
    if (!value) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    try {
      const url = `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(value)}&apiKey=${API_KEY}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.items || []);
    } catch (e) {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchLocationSuggestions(value);
  };

  const handleSelect = async (item: any) => {
    setQuery(item.address.label);
    setSuggestions([]);
    // Fetch lat/lon from HERE lookup API
    try {
      const lookupUrl = `https://lookup.search.hereapi.com/v1/lookup?id=${item.id}&apiKey=${API_KEY}`;
      const res = await fetch(lookupUrl);
      const data = await res.json();
      if (data && data.position) {
        onSelect({ position: { lat: String(data.position.lat), lon: String(data.position.lng) } });
      }
    } catch (e) {
      // fallback: do nothing
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-500 mb-1">Search Location</label>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Type a location..."
        className="w-full p-2 border rounded-md"
      />
      {loading && <div className="text-xs text-gray-400">Loading...</div>}
      {suggestions.length > 0 && (
        <ul className="border bg-white rounded-md mt-1 max-h-40 overflow-auto z-10 relative">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="cursor-pointer p-2 hover:bg-gray-200"
            >
              {item.address.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchLocationInput; 