import React from 'react';

const FastCheckbox = React.memo(({ checked, onChange, isHeader = false, isIndeterminate = false }) => {
  const inputRef = React.useRef(null);

  // Update the indeterminate state when it changes
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="flex items-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
        className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${
          isHeader ? 'mr-4' : ''
        } translate-y-[2px]`}
        aria-label={isHeader ? "Select all" : "Select row"}
      />
    </div>
  );
});

FastCheckbox.displayName = 'FastCheckbox';

export default FastCheckbox;
