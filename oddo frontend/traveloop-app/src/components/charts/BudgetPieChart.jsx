import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = {
  transport:  '#0058be',
  stay:       '#16a34a',
  activities: '#924700',
  meals:      '#6d28d9',
  misc:       '#575f67',
};

const COLOR_LIST = ['#0058be','#16a34a','#924700','#6d28d9','#575f67','#2170e4'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background:'white', border:'1px solid #c2c6d6', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#191b23', marginBottom:4, textTransform:'capitalize' }}>{name}</div>
      <div style={{ fontSize:14, color:'#0058be', fontFamily:'JetBrains Mono', fontWeight:600 }}>{formatCurrency(value)}</div>
    </div>
  );
}

export default function BudgetPieChart({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign:'center', color:'#727785', padding:40, fontSize:14 }}>No expense data yet — add expenses to see breakdown!</div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} stroke="none">
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || COLOR_LIST[i % COLOR_LIST.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize:13, color:'#424754' }} formatter={(v) => <span style={{ color:'#424754', textTransform:'capitalize' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
