import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  onReset: () => void;
}

export const UserFilterBar = ({
  search,
  onSearch,
  role,
  onRoleChange,
  onReset,
}: UserFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par email..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filtrer par rôle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les rôles</SelectItem>
          <SelectItem value="admin">Administrateurs</SelectItem>
          <SelectItem value="collaborateur">Collaborateurs</SelectItem>
          <SelectItem value="compta">Comptables</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={onReset}
        className="w-full sm:w-auto"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Réinitialiser
      </Button>
    </div>
  );
};