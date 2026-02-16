import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockAlertes } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const unreadAlerts = mockAlertes.filter(a => !a.lu);

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 pl-9 bg-muted/50 border focus-visible:ring-1"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Alertes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unreadAlerts.slice(0, 5).map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex flex-col items-start p-3">
                <div className="flex items-center gap-2 w-full">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    alert.priorite === 'HAUTE' && 'bg-destructive',
                    alert.priorite === 'MOYENNE' && 'bg-warning',
                    alert.priorite === 'BASSE' && 'bg-info'
                  )} />
                  <span className="font-medium text-sm">{alert.titre}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {alert.description}
                </p>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary font-medium">
              Voir toutes les alertes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick actions */}
        {actions}
      </div>
    </header>
  );
}
