import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    desc: string;
}

interface ProfileNavProps {
    items: NavItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

export function ProfileNav({ items, activeId, onSelect }: ProfileNavProps) {
    return (
        <div className="space-y-2">
            {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                                : "bg-background/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
                        )}
                    >
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isActive ? "bg-white/20" : "bg-background border border-border/50 group-hover:border-primary/30"
                        )}>
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest opacity-60 truncate w-full text-left",
                                isActive ? "text-white/70" : "text-muted-foreground"
                            )}>
                                {item.desc}
                            </span>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
                    </button>
                );
            })}
        </div>
    );
}
