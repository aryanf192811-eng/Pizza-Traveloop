import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const ICONS = {
  success: <CheckCircle size={18} color="var(--green)" />,
  error:   <XCircle size={18} color="var(--red)" />,
  info:    <Info size={18} color="var(--blue)" />,
  warn:    <AlertTriangle size={18} color="var(--yellow)" />,
};

function Toast({ toast }) {
  const { removeToast } = useToast();
  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)}><X size={14} /></button>
      <div className="toast-progress" />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();
  return (
    <div className="toast-container">
      {toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
}
