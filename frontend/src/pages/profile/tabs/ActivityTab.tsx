import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';

interface ActivityTabProps {
    user: any;
}

export function ActivityTab({ user }: ActivityTabProps) {
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(parseDateFromAPI(dateStr));
    };

    const activities = [
        { type: 'Connexion', date: user?.lastSignIn || new Date().toISOString(), device: 'Navigateur Bureau (Chrome)', location: 'Dakar, Sénégal', status: 'Succès' },
        { type: 'Mise à jour profil', date: user?.updatedAt, device: 'Navigateur Bureau (Chrome)', location: 'Dakar, Sénégal', status: 'Succès' },
    ];

    return (
        <Card className="border-border/40 overflow-hidden rounded-[24px] shadow-sm">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Historique d'Activité
                </CardTitle>
                <CardDescription className="text-sm font-medium">Suivez les dernières connexions à votre compte</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {activities.map((item, i) => (
                        <div key={i} className="p-6 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                item.type === 'Connexion' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                            )}>
                                <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="font-bold text-sm tracking-tight">{item.type}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/40">{formatDateTime(item.date)}</p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                    {item.device} • {item.location}
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {item.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
