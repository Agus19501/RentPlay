import { useEffect, useMemo, useState } from 'react';
import './ToastHost.css';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onNotify = (event) => {
      const payload = event.detail || {};
      const id = payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = Number(payload.duration || 3200);

      setToasts((current) => [...current, {
        id,
        message: payload.message || '',
        type: payload.type || 'info'
      }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, duration);
    };

    window.addEventListener('rentplay:notify', onNotify);
    return () => window.removeEventListener('rentplay:notify', onNotify);
  }, []);

  const hasToasts = useMemo(() => toasts.length > 0, [toasts.length]);

  if (!hasToasts) return null;

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
