import React from 'react';

export default function Card({ children, className = '', size = 'compact' }) {
  // compact agora tem mais respiro; default fica mais confortável ainda
  const paddings = size === 'default' ? 'p-6 md:p-7' : 'p-5 md:p-6';

  return (
    <div
      className={`
        bg-card rounded-2xl border border-border
        shadow-[0_8px_18px_rgba(0,0,0,0.06)]
        ${paddings}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
