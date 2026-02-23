import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AudienceDB } from '@/hooks/useAudiences';

export type ViewType = 'agenda' | 'list';
export type ViewMode = 'month' | 'week' | 'day' | 'list';

export function useAudienceUI(audiences: AudienceDB[]) {
    const [view, setView] = useState<ViewType>('list');
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Simple variables for stats
    const nonRenseignees = audiences.filter(a => a.statut === 'PASSEE_NON_RENSEIGNEE');
    const aVenir = audiences.filter(a => a.statut === 'A_VENIR');
    const renseignees = audiences.filter(a => a.statut === 'RENSEIGNEE');

    const filteredAudiences = useMemo(() => {
        return audiences.filter(a => {
            if (statusFilter !== 'all' && a.statut !== statusFilter) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    a.affaire?.reference?.toLowerCase().includes(query) ||
                    a.affaire?.intitule?.toLowerCase().includes(query) ||
                    a.juridiction?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [audiences, statusFilter, searchQuery]);

    const events = useMemo(() => {
        return filteredAudiences.map(a => ({
            id: a.id,
            date: a.date,
            time: a.heure,
            caseReference: a.affaire?.reference || 'N/A',
            parties: a.affaire?.intitule || 'N/A',
            jurisdiction: a.juridiction || 'N/A',
            type: a.type || 'AUTRE',
            status: a.statut,
            chamber: a.chambre || '',
            audience: a
        }));
    }, [filteredAudiences]);

    const groupedEvents = useMemo(() => {
        const groups: Record<string, typeof events> = {};

        events.forEach(event => {
            const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(event);
        });

        return Object.entries(groups)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, items]) => ({
                title: format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr }),
                date,
                events: items.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            }));
    }, [events]);

    return {
        view, setView,
        viewMode, setViewMode,
        currentMonth, setCurrentMonth,
        selectedDate, setSelectedDate,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        nonRenseignees,
        aVenir,
        renseignees,
        filteredAudiences,
        events,
        groupedEvents
    };
}
