import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, CreditCard, FileText } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatDate, formatCurrency } from '../utils/formatters';
import Spinner from '../components/ui/Spinner';
import { PageSpinner } from '../components/ui/Spinner';

export default function InvoicePage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await api.get(`/trips/${id}/invoice`);
      setData(res.data);
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/trips/${id}/invoice/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.download = `traveloop-invoice-${id}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch { addToast('PDF download failed', 'error'); }
    finally { setDownloading(false); }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.patch(`/trips/${id}/invoice/pay`);
      await load(); addToast('Invoice marked as paid!', 'success');
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setPaying(false); }
  };

  if (loading) return <PageSpinner />;
  if (!data) return null;
  const { invoice, line_items, trip, user } = data;

  return (
    <div className="w-full pb-12 max-w-4xl mx-auto">
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:bg-surface hover:text-on-surface px-6 py-3 rounded-xl font-bold text-[14px] flex items-center gap-2 transition-all shadow-sm" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? <Spinner size={16}/> : <Download size={18}/>} Download PDF
        </button>
        {!invoice.is_paid && (
          <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:shadow-[0px_8px_16px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all" onClick={handlePay} disabled={paying}>
            {paying ? <Spinner size={16} color="#fff"/> : <CreditCard size={18}/>} Mark as Paid
          </button>
        )}
      </div>

      {/* Invoice paper */}
      <div className="bg-surface-container-lowest rounded-[32px] p-8 md:p-12 shadow-[0px_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 relative overflow-hidden">
        {invoice.is_paid && (
          <div className="absolute top-12 right-12 text-[#14B8A6] font-display-lg text-[40px] font-bold tracking-widest uppercase border-4 border-[#14B8A6] rounded-xl px-6 py-2 opacity-10 rotate-12 pointer-events-none mix-blend-multiply">
            PAID
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 border-b border-outline-variant/20 pb-8">
          <div>
            <div className="font-display-lg text-[28px] font-bold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[32px]">flight_takeoff</span>
              TRAVELOOP
            </div>
            <div className="text-[14px] text-on-surface-variant mt-1 font-medium tracking-wide uppercase">Travel Invoice</div>
          </div>
          <div className="md:text-right">
            <div className="text-[12px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">INVOICE NUMBER</div>
            <div className="font-mono text-[18px] text-on-surface font-bold mb-3">{invoice.invoice_number}</div>
            <div className="text-[14px] text-on-surface-variant mb-3">{formatDate(invoice.generated_date)}</div>
            <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide ${invoice.is_paid ? 'bg-[#14B8A6]/10 text-[#14B8A6]' : 'bg-error/10 text-error'}`}>
              {invoice.is_paid ? 'PAID' : 'UNPAID'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 bg-surface p-6 rounded-[24px] border border-outline-variant/30">
          <div>
            <div className="text-[12px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">Billed To</div>
            <div className="text-[18px] font-bold text-on-surface mb-1">{user.first_name} {user.last_name}</div>
            <div className="text-[15px] text-on-surface-variant">{user.email}</div>
          </div>
          <div>
            <div className="text-[12px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">Trip Details</div>
            <div className="text-[18px] font-bold text-on-surface mb-1">{trip.title}</div>
            <div className="text-[15px] text-on-surface-variant flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">calendar_today</span>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</div>
          </div>
        </div>

        {/* Line items */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-outline-variant/30">
                <th className="py-4 px-2 text-[13px] font-bold text-on-surface-variant tracking-wider uppercase">Date</th>
                <th className="py-4 px-2 text-[13px] font-bold text-on-surface-variant tracking-wider uppercase">Description</th>
                <th className="py-4 px-2 text-[13px] font-bold text-on-surface-variant tracking-wider uppercase">Category</th>
                <th className="py-4 px-2 text-[13px] font-bold text-on-surface-variant tracking-wider uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {(line_items || []).map(item => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-4 px-2 text-[15px] text-on-surface-variant">{formatDate(item.expense_date)}</td>
                  <td className="py-4 px-2 text-[15px] font-medium text-on-surface">{item.description}</td>
                  <td className="py-4 px-2"><span className="bg-primary-container text-primary-dark text-[12px] font-bold px-3 py-1 rounded-full">{item.category}</span></td>
                  <td className="py-4 px-2 text-[15px] font-mono font-medium text-on-surface text-right">{formatCurrency(item.amount, item.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-6 border-t border-outline-variant/20">
          <table className="w-full max-w-[320px] text-[15px]">
            <tbody>
              <tr><td className="py-2 text-on-surface-variant">Subtotal</td><td className="py-2 font-mono text-right font-medium text-on-surface">{formatCurrency(invoice.subtotal)}</td></tr>
              {invoice.tax_rate > 0 && <tr><td className="py-2 text-on-surface-variant">Tax ({invoice.tax_rate}%)</td><td className="py-2 font-mono text-right font-medium text-on-surface">{formatCurrency(invoice.subtotal * invoice.tax_rate / 100)}</td></tr>}
              {invoice.discount > 0 && <tr><td className="py-2 text-[#14B8A6] font-medium">Discount</td><td className="py-2 font-mono text-right font-medium text-[#14B8A6]">−{formatCurrency(invoice.discount)}</td></tr>}
              <tr>
                <td className="pt-6 pb-2 text-[18px] font-bold text-on-surface border-t border-outline-variant/30 mt-4 block">Grand Total</td>
                <td className="pt-6 pb-2 text-[24px] font-mono font-bold text-primary text-right border-t border-outline-variant/30 mt-4">{formatCurrency(invoice.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
