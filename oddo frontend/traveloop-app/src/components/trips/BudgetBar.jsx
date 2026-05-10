import { formatCurrency } from '../../utils/formatters';

export default function BudgetBar({ budget, spent }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = spent > budget;
  const fillClass = isOver ? 'over' : pct >= 75 ? 'warn' : '';

  return (
    <div className="budget-bar-wrap">
      <div className="budget-bar-track">
        <div
          className={`budget-bar-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="budget-bar-labels">
        <span>
          Spent: {formatCurrency(spent)}
          {isOver && <span className="over-budget-badge">OVER BUDGET</span>}
        </span>
        <span>Budget: {formatCurrency(budget)}</span>
      </div>
    </div>
  );
}
