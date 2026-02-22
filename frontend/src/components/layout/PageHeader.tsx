import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface HeaderAction {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: HeaderAction;
    actions?: HeaderAction[];
    backLink?: string;
    backText?: string;
}

export function PageHeader({ title, description, action, actions, backLink, backText = "Retour" }: PageHeaderProps) {
    const navigate = useNavigate();
    const allActions = actions || (action ? [action] : []);

    return (
        <div className="space-y-4 mb-8 text-black">
            {backLink && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(backLink)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {backText}
                </Button>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="text-3xl lg:text-4xl font-display font-black tracking-tight text-foreground uppercase break-words">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground text-lg mt-1 font-medium italic opacity-85">
                            {description}
                        </p>
                    )}
                </div>

                {allActions.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {allActions.map((act, index) => (
                            <Button
                                key={index}
                                size="lg"
                                variant={act.variant || (index === 0 && !actions ? 'default' : 'outline')}
                                onClick={act.onClick}
                                className={`h-12 px-6 rounded-xl gap-2 font-bold transition-all hover:scale-105 active:scale-95 ${index === 0 && !act.variant ? 'shadow-lg shadow-primary/20' : ''
                                    }`}
                            >
                                {act.icon}
                                {act.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
