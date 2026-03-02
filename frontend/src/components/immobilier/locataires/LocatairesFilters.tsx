import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search, Filter, X, Users, Briefcase } from 'lucide-react';

interface LocatairesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  professionFilter?: string;
  onProfessionFilterChange?: (value: string) => void;
  onClearFilters?: () => void;
}

export function LocatairesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  professionFilter,
  onProfessionFilterChange,
  onClearFilters
}: LocatairesFiltersProps) {
  const hasActiveFilters = statusFilter || professionFilter;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 shadow-sm transition-all hover:shadow-md">
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
        <Input
          placeholder="Rechercher un locataire (nom, tel, email)..."
          className="pl-11 h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium shadow-none outline-none"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-3">
        {onStatusFilterChange && (
          <div className="relative w-full sm:w-[220px] group">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
            <SearchableSelect
              value={statusFilter}
              onValueChange={onStatusFilterChange}
              options={[
                { value: "all", label: "Tous les statuts" },
                { value: "with_lot", label: "Avec lot assigné" },
                { value: "without_lot", label: "Sans lot" },
                { value: "active_lease", label: "Bail actif" }
              ]}
              placeholder="Statut"
              className="h-12 pl-11 rounded-2xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
            />
          </div>
        )}

        {onProfessionFilterChange && (
          <div className="relative w-full sm:w-[220px] group">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
            <SearchableSelect
              value={professionFilter}
              onValueChange={onProfessionFilterChange}
              options={[
                { value: "all", label: "Toutes professions" },
                { value: "employe", label: "Employé" },
                { value: "fonctionnaire", label: "Fonctionnaire" },
                { value: "commercant", label: "Commerçant" },
                { value: "etudiant", label: "Étudiant" },
                { value: "retraite", label: "Retraité" },
                { value: "autre", label: "Autre" }
              ]}
              placeholder="Profession"
              className="h-12 pl-11 rounded-2xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
            />
          </div>
        )}

        <div className="flex gap-2">
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClearFilters}
              className="h-12 w-12 rounded-2xl border-border/40 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all flex-shrink-0"
              title="Effacer les filtres"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl border-border/40 bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all flex-shrink-0"
            title="Plus de filtres"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}