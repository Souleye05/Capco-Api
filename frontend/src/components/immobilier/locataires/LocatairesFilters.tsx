import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row gap-4 p-6 bg-muted/20 rounded-2xl border border-border/50">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone ou email..."
          className="pl-9 h-11 rounded-xl border-border/50 bg-background"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        {onStatusFilterChange && (
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl border-border/50 bg-background">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="with_lot">Avec lot assigné</SelectItem>
              <SelectItem value="without_lot">Sans lot</SelectItem>
              <SelectItem value="active_lease">Bail actif</SelectItem>
            </SelectContent>
          </Select>
        )}

        {onProfessionFilterChange && (
          <Select value={professionFilter} onValueChange={onProfessionFilterChange}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl border-border/50 bg-background">
              <SelectValue placeholder="Profession" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes professions</SelectItem>
              <SelectItem value="employe">Employé</SelectItem>
              <SelectItem value="fonctionnaire">Fonctionnaire</SelectItem>
              <SelectItem value="commercant">Commerçant</SelectItem>
              <SelectItem value="etudiant">Étudiant</SelectItem>
              <SelectItem value="retraite">Retraité</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && onClearFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={onClearFilters}
            className="h-11 w-11 rounded-xl border-border/50"
            title="Effacer les filtres"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-border/50"
          title="Plus de filtres"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}