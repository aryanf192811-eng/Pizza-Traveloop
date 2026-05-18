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
    <div className="w-full pb-12">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="font-display-sm text-[36px] leading-[1.2] font-bold text-on-surface">Trip Budget</h1>
          <p className="font-body-lg text-[18px] text-on-surface-variant mt-2 flex items-center gap-2">
            Manage and track your trip expenses.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="bg-primary text-white px-8 py-3.5 rounded-full font-label-md text-[15px] font-bold flex items-center gap-2 hover:shadow-[0px_10px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all" 
            onClick={() => setAddOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">add</span> Add Expense
          </button>
        </div>
      </header>

      {/* Alert Banner */}
      {budget.is_over_budget && (
        <div className="bg-error-container/80 backdrop-blur-md border border-error/20 rounded-[24px] p-6 mb-10 flex items-start gap-4 shadow-[0px_10px_30px_rgba(186,26,26,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="bg-error/20 p-3 rounded-full text-error shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-[18px] text-on-error-container font-bold mb-1">Nearing Budget Limit</h3>
            <p className="font-body-md text-[16px] text-on-error-container/80">
              You have exceeded your total budget by {formatCurrency(Math.abs(budget.remaining))}. Consider reviewing upcoming activities.
            </p>
          </div>
        </div>
      )}

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Total Budget */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] hover:shadow-[0px_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-widest">Total Budget</h3>
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-display-sm text-[48px] leading-[1] text-on-surface font-bold">{formatCurrency(budget.total_budget)}</div>
        </div>

        {/* Total Spent */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] hover:shadow-[0px_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-widest">Total Spent</h3>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
          </div>
          <div className={`font-display-sm text-[48px] leading-[1] font-bold relative z-10 ${budget.is_over_budget ? 'text-error' : 'text-primary'}`}>
            {formatCurrency(budget.total_spent)}
          </div>
          <div className="w-full bg-surface-container-high h-2.5 rounded-full mt-6 overflow-hidden relative z-10">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${budget.is_over_budget ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(pctUsed, 100)}%` }}></div>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] hover:shadow-[0px_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-tertiary/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-tertiary/20 transition-colors"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-widest">Remaining</h3>
            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">savings</span>
            </div>
          </div>
          <div className={`font-display-sm text-[48px] leading-[1] font-bold relative z-10 ${budget.remaining >= 0 ? 'text-on-surface' : 'text-error'}`}>
            {formatCurrency(budget.remaining)}
          </div>
          <div className="font-label-md text-[14px] text-on-surface-variant mt-4 font-bold bg-surface-container-low px-3 py-1.5 rounded-lg w-fit relative z-10">{pctUsed}% Used</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline-md text-[24px] font-bold text-on-surface">Spending by Category</h3>
            <span className="material-symbols-outlined text-on-surface-variant opacity-50">pie_chart</span>
          </div>
          <div className="flex-1 min-h-[300px]">
            <BudgetPieChart data={pieData} />
          </div>
        </div>
        <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline-md text-[24px] font-bold text-on-surface">Spending by City</h3>
            <span className="material-symbols-outlined text-on-surface-variant opacity-50">bar_chart</span>
          </div>
          <div className="flex-1 min-h-[300px]">
            <BudgetBarChart data={budget.by_stop || []} />
          </div>
        </div>
      </div>

      {/* Expense Log */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-primary opacity-50"></div>
        <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="font-headline-lg text-[28px] font-bold text-on-surface">Recent Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant italic font-body-lg text-[18px]">
              <span className="material-symbols-outlined text-[48px] opacity-20 block mb-4">receipt_long</span>
              No expenses recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 text-on-surface-variant font-label-md text-[13px] font-bold border-b border-outline-variant/20 uppercase tracking-widest">
                  <th className="p-6">Date</th>
                  <th className="p-6">Description</th>
                  <th className="p-6">Category</th>
                  <th className="p-6 text-right">Amount</th>
                  <th className="p-6 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-lg text-[16px] text-on-surface">
                {expenses.map(e => {
                  let badgeColors = 'bg-surface-variant text-on-surface-variant border border-outline-variant/30';
                  let icon = 'receipt';
                  if (e.category === 'hotel') { badgeColors = 'bg-tertiary-container/50 text-tertiary border border-tertiary/20'; icon = 'hotel'; }
                  else if (e.category === 'transport') { badgeColors = 'bg-[#14B8A6]/20 text-[#0D9488] border border-[#14B8A6]/20'; icon = 'train'; }
                  else if (e.category === 'food') { badgeColors = 'bg-primary-container/50 text-primary border border-primary/20'; icon = 'restaurant'; }
                  
                  return (
                  <tr key={e.id} className="border-b border-outline-variant/10 hover:bg-white transition-colors group">
                    <td className="p-6 text-on-surface-variant font-medium">{formatDate(e.expense_date)}</td>
                    <td className="p-6 font-bold text-on-surface">{e.description}</td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 ${badgeColors} px-3 py-1.5 rounded-full text-[11px] font-label-md font-bold uppercase tracking-widest`}>
                        <span className="material-symbols-outlined text-[14px]">{icon}</span> {e.category}
                      </span>
                    </td>
                    <td className="p-6 text-right font-mono font-bold text-[18px] whitespace-nowrap">{formatCurrency(e.amount, e.currency)}</td>
                    <td className="p-6 text-center">
                      <button className="text-on-surface-variant hover:text-error hover:bg-error/10 w-10 h-10 inline-flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100" onClick={() => handleDelete(e.id)}>
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Expense" size="md">
        <form onSubmit={handleAdd} noValidate className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group mb-0">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Amount (₹) *</label>
              <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="absolute left-4 material-symbols-outlined text-[20px] text-outline">payments</span>
                <input className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 font-mono text-[16px] placeholder:text-outline/70" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="form-group mb-0">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Category *</label>
              <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="absolute left-4 material-symbols-outlined text-[20px] text-outline">category</span>
                <select className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 appearance-none text-[16px] text-on-surface" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description *</label>
            <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="absolute left-4 material-symbols-outlined text-[20px] text-outline">notes</span>
              <input className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 text-[16px] placeholder:text-outline/70" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Flight to Goa" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group mb-0">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date</label>
              <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="absolute left-4 material-symbols-outlined text-[20px] text-outline">calendar_today</span>
                <input className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 text-[16px]" type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group mb-0">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Link to Stop</label>
              <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="absolute left-4 material-symbols-outlined text-[20px] text-outline">pin_drop</span>
                <select className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 appearance-none text-[16px] text-on-surface" value={form.stop_id} onChange={e => setForm(f => ({ ...f, stop_id: e.target.value }))}>
                  <option value="">None</option>
                  {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-6 border-t border-outline-variant/20 mt-4">
            <button type="button" className="px-6 py-2.5 rounded-full font-bold text-[15px] text-on-surface-variant hover:bg-surface-variant/50 transition-colors" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="submit" className="bg-primary text-white px-8 py-2.5 rounded-full font-bold text-[15px] flex items-center justify-center min-w-[140px] hover:shadow-[0px_8px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all" disabled={addLoading}>
              {addLoading ? <Spinner size={20} color="#fff"/> : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
