import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground text-lg mt-2 font-medium opacity-80">
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <Button
                    size="lg"
                    onClick={action.onClick}
                    className="h-14 px-8 rounded-[24px] gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    {action.icon}
                    <span className="font-bold">{action.label}</span>
                </Button>
            )}
        </div>
    );
}
