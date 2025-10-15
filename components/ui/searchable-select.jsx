import React, { useState, useMemo } from 'react';


const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const selectedLabel = options.find((opt) => String(opt.value) === String(value))?.label;

  return (
    <div className={`relative w-full ${className}`} tabIndex={-1}>
      {label && <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>}
      <button
        type="button"
        className={`w-full border rounded-md px-3 py-2 text-left bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-primary`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selectedLabel ? '' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <span className="absolute right-3  pointer-events-none">
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 8l4 4 4-4" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              className="w-full border px-2 py-1 rounded focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-40 overflow-auto">
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-gray-400">No options</li>
            )}
            {filteredOptions.map((opt) => (
              <li
                key={opt.value}
                className={`px-3 py-2 cursor-pointer hover:bg-primary/10 ${String(opt.value) === String(value) ? 'bg-primary/20 font-semibold' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Overlay to close dropdown when clicking outside */}
      {open && !disabled && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SearchableSelect; 