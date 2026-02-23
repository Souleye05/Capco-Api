import { Search, List, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudienceFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    view: 'agenda' | 'list';
    onViewChange: (view: 'agenda' | 'list') => void;
    counts: {
        aVenir: number;
        nonRenseignees: number;
        total: number;
    };
}

export function AudienceFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    view,
    onViewChange,
    counts
}: AudienceFiltersProps) {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="pl-9 h-11 bg-white border-none shadow-sm w-full"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl">
                <button
                    onClick={() => onStatusChange('A_VENIR')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                        statusFilter === 'A_VENIR'
                            ? "bg-success text-success-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                    )}
                >
                    À venir <span className="ml-1 opacity-80">{counts.aVenir}</span>
                </button>
                <button
                    onClick={() => onStatusChange('PASSEE_NON_RENSEIGNEE')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                        statusFilter === 'PASSEE_NON_RENSEIGNEE'
                            ? "bg-success text-success-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                    )}
                >
                    Non renseignées
                </button>
                <button
                    onClick={() => onStatusChange('all')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                        statusFilter === 'all'
                            ? "bg-success text-success-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                    )}
                >
                    Toutes
                </button>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border h-11">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-9 w-9 transition-colors rounded-lg",
                        view === 'list' ? "bg-success text-success-foreground hover:bg-success/90" : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => onViewChange('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-9 w-9 transition-colors rounded-lg",
                        view === 'agenda' ? "bg-success text-success-foreground hover:bg-success/90" : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => onViewChange('agenda')}
                >
                    <CalendarIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
