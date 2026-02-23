import { User as UserIcon, Calendar, Clock, CheckCircle2, Shield } from 'lucide-react';
import { User } from '@/integrations/nestjs/client';
import { AppRole } from '@/contexts/NestJSAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { parseDateFromAPI } from '@/lib/date-utils';

interface PersonalInfoTabProps {
    user: User;
    roles: AppRole[];
}

export function PersonalInfoTab({ user, roles }: PersonalInfoTabProps) {
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(parseDateFromAPI(dateStr));
    };

    return (
        <Card className="border-border/40 overflow-hidden rounded-[24px] shadow-sm">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" /> Informations Personnelles
                </CardTitle>
                <CardDescription className="text-sm font-medium">Vos informations d'identification et rôles système</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Adresse Email</Label>
                        <div className="relative group">
                            <Input value={user.email} disabled className="h-12 rounded-xl bg-muted/30 border-transparent pr-10 font-bold" />
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Identifiant Unique</Label>
                        <Input value={user.id} disabled className="h-12 rounded-xl bg-muted/30 border-transparent font-mono text-xs" />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Rôles Attribués</Label>
                    <div className="flex flex-wrap gap-2">
                        {roles.map(role => (
                            <Badge key={role} className="h-10 px-6 rounded-xl bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                                <Shield className="h-3.5 w-3.5" /> {role}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border/50 transition-all flex-1 min-w-[200px]">
                        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-primary"><Calendar className="h-5 w-5" /></div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Inscrit le</p>
                            <p className="font-bold tracking-tight text-sm">{formatDateTime(user.createdAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border/50 transition-all flex-1 min-w-[200px]">
                        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-orange-500"><Clock className="h-5 w-5" /></div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Dernière mise à jour</p>
                            <p className="font-bold tracking-tight text-sm">{formatDateTime(user.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
