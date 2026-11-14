import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ActionDialog from './ActionDialog';
import reportService from '../services/reportService';

const REPORT_REASONS = [
  'Misleading cultural claim',
  'Disrespectful or harmful',
  'Wrong information',
  'Other',
];

export default function ReportContentButton({ targetType, targetId }) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  async function submitReport(event) {
    event.preventDefault();
    if (!reason) {
      setError('Choose a reason for your report.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await reportService.createReport({
        targetType,
        targetId,
        reason,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {submitted ? (
        <p role="status" className="text-sm text-green-800">
          Thank you. Your report was sent to moderators for review.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError('');
            setDialogOpen(true);
          }}
          className="text-sm font-medium text-[#8f3e29] underline underline-offset-2 hover:text-[#6f2e1e]"
        >
          Report this
        </button>
      )}
      {dialogOpen && (
        <ActionDialog title="Report this content" size="compact" onClose={() => setDialogOpen(false)}>
          <form onSubmit={submitReport} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="mb-1 block text-sm font-medium text-[#493126]">
                Reason
              </label>
              <select
                id="report-reason"
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-md border border-[#e1d7ca] bg-white px-3 py-2 text-sm"
              >
                <option value="">Choose a reason</option>
                {REPORT_REASONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="report-message" className="mb-1 block text-sm font-medium text-[#493126]">
                Additional details <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <textarea
                id="report-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-[#e1d7ca] px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border border-[#e1d7ca] px-3 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !reason} className="rounded-md bg-[#ad482d] px-3 py-2 text-sm text-white disabled:opacity-50">
                {submitting ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </form>
        </ActionDialog>
      )}
    </div>
  );
}
