import { useMemo } from 'react';
import { EvenementCalendrier, StatutAudience } from '@/types/legal';
import { 
    isToday, 
    addDays, 
    getStartOfDay, 
    isSameDay,
    isBefore
} from '@/lib/date-utils';

interface UseEventFiltersProps {
    events: EvenementCalendrier[];
    searchQuery: string;
    statusFilter: StatutAudience | 'all';
}

interface GroupedEvents {
    title: string;
    events: EvenementCalendrier[];
}

export function useEventFilters({ events, searchQuery, statusFilter }: UseEventFiltersProps) {
    // Filter events based on search query and status filter
    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchesSearch =
                event.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.referenceAffaire.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.parties.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.juridiction.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || event.statut === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [events, searchQuery, statusFilter]);

    // Group events for list view
    const groupedEvents = useMemo(() => {
        const sorted = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const groups: GroupedEvents[] = [
            { title: "Aujourd'hui", events: [] },
            { title: 'Demain', events: [] },
            { title: 'Cette semaine', events: [] },
            { title: 'Plus tard', events: [] },
            { title: 'Passé', events: [] },
        ];

        const now = new Date();
        const today = getStartOfDay(now);
        const tomorrow = addDays(today, 1);

        sorted.forEach(event => {
            const eventDate = getStartOfDay(new Date(event.date));
            const daysDiff = Math.abs(eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            
            if (isToday(eventDate)) {
                groups[0].events.push(event);
            } else if (isSameDay(eventDate, tomorrow)) {
                groups[1].events.push(event);
            } else if (daysDiff <= 7 && !isBefore(eventDate, today)) {
                groups[2].events.push(event);
            } else if (!isBefore(eventDate, today)) {
                groups[3].events.push(event);
            } else {
                groups[4].events.push(event);
            }
        });

        return groups.filter(g => g.events.length > 0);
    }, [filteredEvents]);

    return {
        filteredEvents,
        groupedEvents,
    };
}
