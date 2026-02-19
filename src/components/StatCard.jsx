import React from 'react';

export default function StatCard({ icon: Icon, value, label }) {
  return (
    <div
      className="
        bg-card rounded-2xl border border-border
        shadow-[0_8px_18px_rgba(0,0,0,0.06)]
        p-4 flex items-center gap-3
        transition-all duration-200
        hover:shadow-[0_14px_26px_rgba(0,0,0,0.10)]
        hover:-translate-y-[1px]
      "
    >
      <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-primary" />
      </div>

      <div className="min-w-0">
        <p className="text-2xl md:text-3xl font-heading font-semibold text-foreground leading-none tabular-nums">
          {value}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}
