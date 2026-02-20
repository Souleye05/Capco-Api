import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, subtitle, actions, breadcrumbs }: HeaderProps) {
  const unreadAlerts = mockAlertes.filter(a => !a.lu);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="pt-3 pb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-border">/</span>}
                {crumb.href ? (
                  <button 
                    onClick={() => navigate(crumb.href!)} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Main header row */}
        <div className={cn(
          "flex items-center justify-between gap-4",
          breadcrumbs ? "py-3" : "py-4"
        )}>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {unreadAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
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
                        'w-2 h-2 rounded-full shrink-0',
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
                <DropdownMenuItem 
                  className="justify-center text-primary font-medium"
                  onClick={() => navigate('/alertes')}
                >
                  Voir toutes les alertes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Page actions */}
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
