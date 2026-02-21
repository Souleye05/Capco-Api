import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatusVariant = 'success' | 'warning' | 'destructive' | 'info' | 'default' | 'muted';

interface StatusBadgeProps {
    label: string;
    variant?: StatusVariant;
    className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-primary/10 text-primary border-primary/20',
    muted: 'bg-muted text-muted-foreground border-muted'
};

export function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn('font-medium text-[10px] uppercase tracking-wider px-2 py-0.5', variantStyles[variant], className)}
        >
            {label}
        </Badge>
    );
}
