import { ReactNode, ElementType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon | ElementType;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'primary' | 'success' | 'destructive' | 'warning' | 'info' | 'contentieux' | 'recouvrement' | 'immobilier';
    onClick?: () => void;
    className?: string;
}

const variantStyles = {
    default: {
        icon: 'text-muted-foreground',
        bg: 'bg-muted',
        text: 'text-foreground'
    },
    primary: {
        icon: 'text-primary',
        bg: 'bg-primary/10',
        text: 'text-primary'
    },
    success: {
        icon: 'text-success',
        bg: 'bg-success/10',
        text: 'text-success'
    },
    destructive: {
        icon: 'text-destructive',
        bg: 'bg-destructive/10',
        text: 'text-destructive'
    },
    warning: {
        icon: 'text-amber-600',
        bg: 'bg-amber-100',
        text: 'text-amber-600'
    },
    info: {
        icon: 'text-blue-600',
        bg: 'bg-blue-100',
        text: 'text-blue-600'
    },
    contentieux: {
        icon: 'text-primary',
        bg: 'bg-primary/10',
        text: 'text-primary'
    },
    recouvrement: {
        icon: 'text-info',
        bg: 'bg-info/10',
        text: 'text-info'
    },
    immobilier: {
        icon: 'text-orange-600',
        bg: 'bg-orange-100',
        text: 'text-orange-600'
    }
};

export function StatCard({
    title,
    value,
    icon: Icon,
    subtitle,
    trend,
    variant = 'default',
    onClick,
    className
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 border-border/50",
                onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]" : "cursor-default",
                className
            )}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn(
                    "p-3 rounded-xl transition-all duration-300 shadow-sm group-hover:scale-110",
                    styles.bg,
                    styles.icon
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <p className={cn("text-2xl font-black tracking-tight", styles.text)}>
                            {value}
                        </p>
                        {trend && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                                trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            )}>
                                {trend.isPositive ? '↑' : '↓'}
                                {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium truncate opacity-70">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
