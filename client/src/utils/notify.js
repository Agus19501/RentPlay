export function notify(message, type = 'info', duration = 3200) {
  const text = String(message || '').trim();
  if (!text) return;

  window.dispatchEvent(new CustomEvent('rentplay:notify', {
    detail: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: text,
      type,
      duration
    }
  }));
}
