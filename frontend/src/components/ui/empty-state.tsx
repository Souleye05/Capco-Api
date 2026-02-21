import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex items-center justify-center py-12 text-center",
      className
    )}>
      <div className="text-muted-foreground">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}