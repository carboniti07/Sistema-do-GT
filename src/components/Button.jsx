import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) {
  const base =
    'h-12 px-6 rounded-xl font-medium transition-all duration-[180ms] text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm active:scale-[0.98]',
    secondary:
      'bg-card text-foreground border border-border hover:bg-surface-2 active:scale-[0.98]',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
