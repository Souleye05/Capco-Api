import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'contentieux' | 'recouvrement' | 'immobilier' | 'urgent';
  onClick?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  onClick 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        'bg-background rounded-xl border border-border/60 p-5 transition-all duration-200 hover:shadow-sm cursor-default',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            'text-2xl font-display font-semibold mt-2',
            variant === 'urgent' && 'text-destructive',
            variant === 'contentieux' && 'text-primary',
            variant === 'recouvrement' && 'text-accent',
            variant === 'immobilier' && 'text-immobilier'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-2.5 rounded-lg',
          variant === 'default' && 'bg-muted',
          variant === 'urgent' && 'bg-destructive/10',
          variant === 'contentieux' && 'bg-primary/10',
          variant === 'recouvrement' && 'bg-accent/10',
          variant === 'immobilier' && 'bg-immobilier/10'
        )}>
          <Icon className={cn(
            'h-5 w-5',
            variant === 'default' && 'text-muted-foreground',
            variant === 'urgent' && 'text-destructive',
            variant === 'contentieux' && 'text-primary',
            variant === 'recouvrement' && 'text-accent',
            variant === 'immobilier' && 'text-immobilier'
          )} />
        </div>
      </div>
      {trend && (
        <div className={cn(
          'mt-3 text-sm font-medium',
          trend.isPositive ? 'text-success' : 'text-destructive'
        )}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mois dernier
        </div>
      )}
    </div>
  );
}
