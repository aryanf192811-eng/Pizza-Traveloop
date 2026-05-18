import { formatCurrency } from '../../utils/formatters';

export default function BudgetBar({ budget, spent }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = spent > budget;
  const fillClass = isOver ? 'over' : pct >= 75 ? 'warn' : '';

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cl-on-surface)', marginBottom: '8px' }}>
        <span>Budget</span>
        <span>
          {formatCurrency(spent)} / <span style={{ color: 'var(--cl-outline)' }}>{formatCurrency(budget)}</span>
        </span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'var(--cl-surface-container-high, #e6e7f2)', borderRadius: '999px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: fillClass === 'over' ? 'var(--cl-error)' : fillClass === 'warn' ? 'var(--cl-tertiary)' : 'var(--cl-primary)',
            width: `${pct}%`,
            transition: 'width 0.5s ease',
            borderRadius: '999px',
          }}
        />
      </div>
      {isOver && <div style={{ fontSize: '0.7rem', color: 'var(--cl-error)', marginTop: '4px', fontWeight: 600 }}>OVER BUDGET</div>}
    </div>
  );
}
