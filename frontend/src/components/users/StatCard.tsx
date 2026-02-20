import { ReactNode, ElementType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number;
    icon: ElementType;
    color: string;
    bgColor: string;
}

export const StatCard = ({ title, value, icon: Icon, color, bgColor }: StatCardProps) => (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 shadow-sm", bgColor, color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
        </CardContent>
    </Card>
);
