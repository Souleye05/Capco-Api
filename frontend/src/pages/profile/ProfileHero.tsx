import { Mail, Shield, Camera, LogOut } from 'lucide-react';
import { User } from '@/integrations/nestjs/client';
import { AppRole } from '@/contexts/NestJSAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseDateFromAPI } from '@/lib/date-utils';

interface ProfileHeroProps {
    user: User;
    roles: AppRole[];
    onSignOut: () => void;
}

export function ProfileHero({ user, roles, onSignOut }: ProfileHeroProps) {
    const userName = user.email.split('@')[0].split('.')[0];
    const userInitials = user.email.charAt(0).toUpperCase();

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            .format(parseDateFromAPI(dateStr));
    };

    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[32px] blur opacity-25" />
            <Card className="relative border-none bg-background/60 backdrop-blur-2xl rounded-[32px] overflow-hidden shadow-2xl shadow-primary/5">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group/avatar">
                            <div className="h-32 w-32 rounded-3xl bg-primary flex items-center justify-center text-white text-4xl font-black border-4 border-background shadow-2xl relative z-10">
                                {userInitials}
                            </div>
                            <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl shadow-xl z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-3xl font-black tracking-tight text-foreground capitalize">Maître {userName}</h1>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black uppercase text-[10px] px-3 py-1 rounded-full">Compte Vérifié</Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 font-medium"><Mail className="h-4 w-4" />{user.email}</div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-border md:block hidden" />
                                    <div className="flex items-center gap-1.5 font-medium lowercase"><Shield className="h-4 w-4" />{roles.join(', ') || 'Utilisateur'}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                                <Button className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20">Modifier Profil</Button>
                                <Button variant="outline" onClick={onSignOut} className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-destructive/5 hover:text-destructive">
                                    <LogOut className="h-4 w-4" /> Déconnexion
                                </Button>
                            </div>
                        </div>

                        <div className="hidden lg:grid grid-cols-2 gap-4 border-l border-border/50 pl-8">
                            <div className="bg-muted/30 p-4 rounded-2xl space-y-1 w-44">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Créé le</p>
                                <p className="font-bold text-sm tracking-tight">{formatDate(user.createdAt)}</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-2xl space-y-1 w-44">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Dernier accès</p>
                                <p className="font-bold text-sm tracking-tight">{formatDate(user.lastSignIn) || "Aujourd'hui"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
