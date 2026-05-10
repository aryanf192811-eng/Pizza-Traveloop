import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const budget = payload.find(p => p.dataKey === 'budget')?.value || 0;
  const spent  = payload.find(p => p.dataKey === 'spent')?.value  || 0;
  return (
    <div style={{ background:'white', border:'1px solid #c2c6d6', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight:700, marginBottom:6, color:'#191b23' }}>{label}</div>
      <div style={{ fontSize:13, color:'#727785' }}>Budget: {formatCurrency(budget)}</div>
      <div style={{ fontSize:13, color:'#0058be', fontWeight:600 }}>Spent: {formatCurrency(spent)}</div>
      {spent > budget && <div style={{ fontSize:11, color:'#ba1a1a', fontWeight:700, marginTop:4 }}>⚠ OVER BUDGET</div>}
    </div>
  );
}

export default function BudgetBarChart({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign:'center', color:'#727785', padding:40, fontSize:14 }}>No stop data yet — add stops to your trip!</div>
  );
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top:4, right:8, left:0, bottom:4 }}>
        <XAxis dataKey="city_name" stroke="#c2c6d6" tick={{ fill:'#424754', fontSize:12 }} />
        <YAxis stroke="#c2c6d6" tick={{ fill:'#424754', fontSize:12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize:13, color:'#424754' }} />
        <Bar dataKey="budget" name="Budget" fill="#d8e2ff" radius={[4,4,0,0]} />
        <Bar dataKey="spent"  name="Spent"  fill="#0058be" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
