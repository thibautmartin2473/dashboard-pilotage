import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.todo}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
