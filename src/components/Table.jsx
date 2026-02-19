import React from 'react';

export default function Table({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full table-auto">
        <thead className="bg-surface-2/60">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left align-middle text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-4 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="text-left align-middle text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-4 whitespace-nowrap">
                Acoes
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className="border-b border-border/60 hover:bg-surface-2 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="align-middle py-2.5 px-4 text-sm text-foreground leading-5"
                >
                  <div className="truncate max-w-[520px]">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </div>
                </td>
              ))}
              {actions && <td className="align-middle py-2.5 px-4">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p className="text-center text-muted-foreground py-7 text-sm">
          Nenhum registro encontrado
        </p>
      )}
    </div>
  );
}
