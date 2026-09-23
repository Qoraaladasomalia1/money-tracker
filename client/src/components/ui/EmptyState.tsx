import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

export function EmptyState({
  title = 'No transactions yet',
  description = 'Start by recording money you received or an expense.',
  showAdd = true,
}: {
  title?: string;
  description?: string;
  showAdd?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-border bg-surface">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Inbox size={28} strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-5">{description}</p>
      {showAdd && (
        <Link to="/add">
          <Button>Add Transaction</Button>
        </Link>
      )}
    </div>
  );
}
