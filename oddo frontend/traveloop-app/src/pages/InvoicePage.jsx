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
    <div>
      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginBottom:24 }}>
        <button className="btn btn-secondary" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? <Spinner size={16}/> : <Download size={16}/>} Download PDF
        </button>
        {!invoice.is_paid && (
          <button className="btn btn-primary" onClick={handlePay} disabled={paying}>
            {paying ? <Spinner size={16} color="#fff"/> : <CreditCard size={16}/>} Mark as Paid
          </button>
        )}
      </div>

      {/* Invoice paper */}
      <div className={`invoice-paper${invoice.is_paid ? ' paid-stamp' : ''}`}>
        <div className="invoice-header">
          <div>
            <div className="invoice-brand">✈ TRAVELOOP</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Travel Invoice</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>INVOICE</div>
            <div className="invoice-number">{invoice.invoice_number}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>{formatDate(invoice.generated_date)}</div>
            <span className={`badge ${invoice.is_paid ? 'badge-green' : 'badge-red'}`} style={{ marginTop:8 }}>
              {invoice.is_paid ? 'PAID' : 'UNPAID'}
            </span>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom:24, gap:32 }}>
          <div className="invoice-section">
            <div className="invoice-label">Traveler</div>
            <div style={{ fontWeight:700 }}>{user.first_name} {user.last_name}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{user.email}</div>
          </div>
          <div className="invoice-section">
            <div className="invoice-label">Trip</div>
            <div style={{ fontWeight:700 }}>{trip.title}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</div>
          </div>
        </div>

        {/* Line items */}
        <div className="table-wrap" style={{ marginBottom:24 }}>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
            <tbody>
              {(line_items || []).map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.expense_date)}</td>
                  <td>{item.description}</td>
                  <td><span className="badge badge-blue">{item.category}</span></td>
                  <td className="mono" style={{ textAlign:'right' }}>{formatCurrency(item.amount, item.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <table style={{ width:300 }} className="invoice-totals">
            <tbody>
              <tr><td style={{ color:'var(--text-secondary)', padding:'6px 0' }}>Subtotal</td><td style={{ textAlign:'right', padding:'6px 0' }}>{formatCurrency(invoice.subtotal)}</td></tr>
              {invoice.tax_rate > 0 && <tr><td style={{ color:'var(--text-secondary)', padding:'6px 0' }}>Tax ({invoice.tax_rate}%)</td><td style={{ textAlign:'right', padding:'6px 0' }}>{formatCurrency(invoice.subtotal * invoice.tax_rate / 100)}</td></tr>}
              {invoice.discount > 0 && <tr><td style={{ color:'var(--green)', padding:'6px 0' }}>Discount</td><td style={{ textAlign:'right', color:'var(--green)', padding:'6px 0' }}>−{formatCurrency(invoice.discount)}</td></tr>}
              <tr className="invoice-grand-total">
                <td style={{ fontWeight:800, paddingTop:12, paddingBottom:0 }}>Grand Total</td>
                <td style={{ textAlign:'right', fontWeight:800, paddingTop:12, paddingBottom:0 }}>{formatCurrency(invoice.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
