import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/validators';
import BudgetPieChart from '../components/charts/BudgetPieChart';
import BudgetBarChart from '../components/charts/BudgetBarChart';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function BudgetPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'transport', description: '', stop_id: '', expense_date: '' });

  const loadAll = async () => {
    try {
      const [budRes, expRes, stRes] = await Promise.all([
        api.get(`/trips/${id}/budget`),
        api.get(`/trips/${id}/budget/expenses`),
        api.get(`/trips/${id}/stops`),
      ]);
      setBudget(budRes.data.data);
      setExpenses(expRes.data.data);
      setStops(stRes.data.data);
    } catch { addToast('Failed to load budget', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { addToast('Amount must be > 0', 'error'); return; }
    if (!form.description.trim()) { addToast('Description required', 'error'); return; }
    setAddLoading(true);
    try {
      await api.post(`/trips/${id}/budget/expenses`, {
        amount: parseFloat(form.amount), category: form.category,
        description: form.description,
        stop_id: form.stop_id ? parseInt(form.stop_id) : undefined,
        expense_date: form.expense_date || undefined,
      });
      addToast('Expense added', 'success');
      setAddOpen(false); setForm({ amount:'', category:'transport', description:'', stop_id:'', expense_date:'' });
      await loadAll();
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setAddLoading(false); }
  };

  const handleDelete = async (expId) => {
    try { await api.delete(`/trips/${id}/budget/expenses/${expId}`); await loadAll(); addToast('Expense deleted', 'success'); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  if (loading) return <Spinner size={32} />;
  if (!budget) return null;

  const pctUsed = budget.total_budget > 0 ? Math.round((budget.total_spent / budget.total_budget) * 100) : 0;
  const pieData = (budget.by_category || []).map(r => ({ name: r.category, amount: r.amount }));

  return (
    <div>
      {budget.is_over_budget && (
        <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:20, color:'var(--red)' }}>
          <AlertTriangle size={18}/> You've exceeded your budget by {formatCurrency(Math.abs(budget.remaining))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { label:'Total Budget', value: formatCurrency(budget.total_budget), color:'#2563EB' },
          { label:'Total Spent',  value: formatCurrency(budget.total_spent),  color: budget.is_over_budget ? '#EF4444' : '#10B981' },
          { label:'Remaining',    value: formatCurrency(budget.remaining),     color: budget.remaining >= 0 ? '#10B981' : '#EF4444' },
          { label:'% Used',       value: `${pctUsed}%`,                        color: pctUsed > 100 ? '#EF4444' : '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card card-p" style={{ textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'JetBrains Mono' }}>{s.value}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom:28 }}>
        <div className="card card-p">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Expenses by Category</h3>
          <BudgetPieChart data={pieData} />
        </div>
        <div className="card card-p">
          <h3 style={{ fontWeight:700, marginBottom:16 }}>Budget vs Spent by Stop</h3>
          <BudgetBarChart data={budget.by_stop || []} />
        </div>
      </div>

      {/* Expense log */}
      <div className="card card-p">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontWeight:700 }}>Expense Log</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}><Plus size={14}/> Add Expense</button>
        </div>
        {expenses.length === 0 ? (
          <div className="empty-state"><div className="empty-title">No expenses yet</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{formatDate(e.expense_date)}</td>
                    <td>{e.description}</td>
                    <td><span className="badge badge-blue">{e.category}</span></td>
                    <td className="mono">{formatCurrency(e.amount, e.currency)}</td>
                    <td><button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(e.id)}><Trash2 size={12}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Expense" size="sm">
        <form onSubmit={handleAdd} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input className="form-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Flight to Goa" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Link to Stop</label>
              <select className="form-select" value={form.stop_id} onChange={e => setForm(f => ({ ...f, stop_id: e.target.value }))}>
                <option value="">None</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>{addLoading ? <Spinner size={16} color="#fff"/> : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
