import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const statutLabels = {
    A_VENIR: { label: 'À venir', className: 'bg-info/10 text-info border-info/20' },
    PASSEE_NON_RENSEIGNEE: { label: 'Non renseignée', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    RENSEIGNEE: { label: 'Renseignée', className: 'bg-success/10 text-success border-success/20' }
};

export const HearingStatusBadge = ({ status }: { status: string }) => {
    const config = statutLabels[status as keyof typeof statutLabels];
    if (!config) return null;

    return (
        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight", config.className)}>
            {config.label}
        </Badge>
    );
};

export const HighlightText = ({ text, highlight }: { text: string; highlight?: string }) => {
    if (!highlight) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ?
                    <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark> :
                    part
            )}
        </span>
    );
};
