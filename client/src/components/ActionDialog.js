import { useEffect } from 'react';

export default function ActionDialog({ title, size = 'default', onClose, children }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211710]/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[#e9dfd2] bg-[#fffefa] p-5 shadow-2xl sm:p-7 ${
          size === 'compact' ? 'max-w-xl' : 'max-w-2xl'
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="action-dialog-title" className="font-serif text-2xl font-bold text-[#35251f]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e9dfd2] text-xl text-[#625953] hover:bg-[#f4eee6]"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
