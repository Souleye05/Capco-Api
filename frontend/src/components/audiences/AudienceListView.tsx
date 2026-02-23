import { useState } from 'react';
import { Calendar as CalendarIcon, Building2, Clock, Users, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { parseDateFromAPI } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupprimerAudienceDialog } from '@/components/dialogs/SupprimerAudienceDialog';
import { HighlightText, HearingStatusBadge } from './AudienceBadge';

const HEARING_TYPE_LABELS = {
    PLAIDOIRIE: 'Plaidoirie',
    MISE_EN_DELIBERE: 'Mise en délibéré',
    JUGEMENT: 'Jugement',
    AUTRE: 'Autre'
};

interface ListViewProps {
    groupedEvents: any[];
    searchQuery: string;
    statusFilter: string;
    onEventClick: (event: any) => void;
    onAddAudience: () => void;
}

export function AudienceListView({ groupedEvents, searchQuery, statusFilter, onEventClick, onAddAudience }: ListViewProps) {
    const [audienceToDelete, setAudienceToDelete] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = (event: any) => {
        setAudienceToDelete({
            id: event.audience?.id || event.id,
            date: event.date,
            juridiction: event.jurisdiction,
            affaire: {
                reference: event.caseReference,
                intitule: event.parties,
            }
        });
        setShowDeleteDialog(true);
    };

    if (groupedEvents.length === 0) {
        return (
            <div className="card-elevated p-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-center">
                    <div className="p-4 bg-muted rounded-full">
                        <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium">Aucune audience trouvée</h3>
                    <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                            ? "Aucune audience ne correspond à vos critères de recherche."
                            : "Vous n'avez pas encore d'audiences programmées."}
                    </p>
                </div>
                {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={onAddAudience} variant="outline" size="sm" className="hover:scale-105 active:scale-95 transition-all">
                        Ajouter une audience
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                {groupedEvents.map((group) => (
                    <div key={group.title} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                                {group.title} ({group.events.length})
                            </h3>
                            <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.events.map((event: any) => (
                                <AudienceListCard
                                    key={event.id}
                                    event={event}
                                    searchQuery={searchQuery}
                                    onClick={() => onEventClick(event)}
                                    onDelete={() => handleDeleteClick(event)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <SupprimerAudienceDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                audience={audienceToDelete}
            />
        </>
    );
}

function AudienceListCard({ event, searchQuery, onClick, onDelete }: { event: any, searchQuery: string, onClick: () => void, onDelete: () => void }) {
    return (
        <div
            className="group card-elevated p-5 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded transition-colors">
                            <HighlightText text={event.caseReference} highlight={searchQuery} />
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight bg-background/50 border-border/50">
                            {HEARING_TYPE_LABELS[event.type as keyof typeof HEARING_TYPE_LABELS] || event.type}
                        </Badge>
                        <HearingStatusBadge status={event.status} />
                    </div>

                    <h4 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        <HighlightText text={event.parties} highlight={searchQuery} />
                    </h4>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5" />
                            <HighlightText text={event.jurisdiction} highlight={searchQuery} />
                        </span>
                        {event.time && (
                            <span className="flex items-center gap-1.5 font-medium py-1 px-2 bg-muted/50 rounded-lg">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {event.time}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 font-medium">
                            <Users className="h-3.5 w-3.5" />
                            <HighlightText text={event.parties.split(' c/ ')[0] + '...'} highlight={searchQuery} />
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <div className="p-2 bg-muted/50 rounded-xl border border-border group-hover:bg-primary group-hover:border-primary transition-all">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary-foreground transition-colors">
                                {new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(parseDateFromAPI(event.date))}
                            </p>
                            <p className="text-2xl text-center font-black text-foreground group-hover:text-primary-foreground transition-colors">
                                {parseDateFromAPI(event.date).getUTCDate()}
                            </p>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter text-center">
                            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' }).format(parseDateFromAPI(event.date))}
                        </p>
                    </div>

                    {/* Menu contextuel */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
