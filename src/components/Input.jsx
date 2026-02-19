import React from 'react';

export default function Input({
  label,
  error,
  className = '',
  onChange,
  readOnly,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`input-field ${readOnly ? 'bg-surface-2 cursor-not-allowed' : ''} ${error ? 'border-destructive' : ''} ${className}`}
        onChange={(e) => onChange && onChange(e.target.value)}
        readOnly={readOnly}
        {...props}
      />
      {error && (
        <span className="text-sm text-destructive mt-1 block">{error}</span>
      )}
    </div>
  );
}
