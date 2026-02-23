import { Search, List, Calendar as CalendarIcon, Filter } from 'lucide-react';
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
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Search bar */}
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        placeholder="Rechercher une audience, affaire, juridiction..."
                        className="pl-9 h-10 bg-background border border-border shadow-none focus-visible:ring-2 focus-visible:ring-success/30 focus-visible:border-success w-full transition-colors"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-muted-foreground mr-1 hidden sm:block" />
                    <button
                        onClick={() => onStatusChange('A_VENIR')}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all duration-200 whitespace-nowrap",
                            statusFilter === 'A_VENIR'
                                ? "bg-success text-success-foreground border-success shadow-sm"
                                : "bg-background text-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
                        )}
                    >
                        À venir
                        <span className={cn(
                            "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold",
                            statusFilter === 'A_VENIR'
                                ? "bg-white/20 text-success-foreground"
                                : "bg-success/15 text-success"
                        )}>
                            {counts.aVenir}
                        </span>
                    </button>
                    <button
                        onClick={() => onStatusChange('PASSEE_NON_RENSEIGNEE')}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all duration-200 whitespace-nowrap",
                            statusFilter === 'PASSEE_NON_RENSEIGNEE'
                                ? "bg-success text-success-foreground border-success shadow-sm"
                                : "bg-background text-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
                        )}
                    >
                        Non renseignées
                        <span className={cn(
                            "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold",
                            statusFilter === 'PASSEE_NON_RENSEIGNEE'
                                ? "bg-white/20 text-success-foreground"
                                : "bg-destructive/15 text-destructive"
                        )}>
                            {counts.nonRenseignees}
                        </span>
                    </button>
                    <button
                        onClick={() => onStatusChange('all')}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all duration-200 whitespace-nowrap",
                            statusFilter === 'all'
                                ? "bg-success text-success-foreground border-success shadow-sm"
                                : "bg-background text-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
                        )}
                    >
                        Toutes
                        <span className={cn(
                            "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold",
                            statusFilter === 'all'
                                ? "bg-white/20 text-success-foreground"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {counts.total}
                        </span>
                    </button>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 transition-all duration-200 rounded-md",
                            view === 'list'
                                ? "bg-success text-success-foreground shadow-sm hover:bg-success/90"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => onViewChange('list')}
                        title="Vue liste"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 transition-all duration-200 rounded-md",
                            view === 'agenda'
                                ? "bg-success text-success-foreground shadow-sm hover:bg-success/90"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => onViewChange('agenda')}
                        title="Vue calendrier"
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
