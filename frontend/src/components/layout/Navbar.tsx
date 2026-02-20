import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    ChevronRight,
    Home,
    Bell,
    User,
    Settings,
    LogOut,
    CheckCheck,
    AlertCircle,
    Info,
    Calendar,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockAlertes } from '@/data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useNestJSAuth();

    // Simple breadcrumb logic
    const pathnames = location.pathname.split('/').filter((x) => x);

    const handleSignOut = async () => {
        await signOut();
        toast.success('Déconnexion réussie');
    };

    const userName = user?.email?.split('@')[0].split('.')[0] || 'Maître';
    const userInitials = user?.email?.substring(0, 1).toUpperCase() || 'M';
    const unreadCount = mockAlertes.filter(a => !a.lu).length;

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'AUDIENCE_NON_RENSEIGNEE': return <Calendar className="h-4 w-4 text-primary" />;
            case 'DOSSIER_SANS_ACTION': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <nav className="sticky top-0 z-30 h-20 w-full border-b border-border/40 bg-background/60 backdrop-blur-2xl flex items-center justify-between px-8">
            <div className="flex items-center gap-6">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-muted-foreground">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 hover:bg-primary/5 hover:text-primary transition-all rounded-xl"
                        onClick={() => navigate('/')}
                    >
                        <Home className="h-5 w-5" />
                    </Button>

                    {pathnames.length > 0 && <ChevronRight className="h-4 w-4 mx-2 shrink-0 opacity-30" />}

                    <div className="flex items-center gap-1 overflow-hidden">
                        {pathnames.map((name, index) => {
                            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                            const isLast = index === pathnames.length - 1;
                            const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

                            return (
                                <div key={name} className="flex items-center gap-1 shrink-0">
                                    {index > 0 && <ChevronRight className="h-4 w-4 mx-1 opacity-20" />}
                                    {isLast ? (
                                        <span className="font-bold text-base tracking-tight text-foreground">{label}</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => navigate(routeTo)}
                                            className="hover:text-primary transition-colors font-medium opacity-60 hover:opacity-100"
                                        >
                                            {label}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Search Bar - Modern Design */}
                <div className="hidden lg:flex items-center relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Rechercher une affaire, audience..."
                        className="w-[400px] h-11 pl-12 bg-muted/40 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all rounded-2xl"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notification Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl hover:bg-primary/5 transition-all">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 h-4 w-4 bg-destructive text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[380px] rounded-[32px] p-2 shadow-2xl border-border/50 backdrop-blur-3xl bg-background/95">
                            <DropdownMenuLabel className="flex items-center justify-between px-4 py-4">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black tracking-tight">Centre de notifications</span>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                        {unreadCount} alertes non lues
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                                    Tout marquer lu
                                </Button>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="mx-2 opacity-30" />
                            <div className="max-h-[400px] overflow-y-auto px-1 py-2 custom-scrollbar">
                                {mockAlertes.map((alert) => (
                                    <DropdownMenuItem
                                        key={alert.id}
                                        onClick={() => navigate(alert.lien)}
                                        className="flex flex-col items-start gap-1 p-4 rounded-2xl mb-1 cursor-pointer hover:bg-muted/50 accent-primary"
                                    >
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                                                    {getAlertIcon(alert.type)}
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">{alert.titre}</span>
                                            </div>
                                            {!alert.lu && <div className="h-2 w-2 rounded-full bg-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-10">
                                            {alert.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 ml-10 text-[10px] font-bold text-muted-foreground/40">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(alert.dateCreation), 'dd MMM HH:mm', { locale: fr })}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                            <DropdownMenuSeparator className="mx-2 opacity-30" />
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/50"
                                onClick={() => navigate('/alertes')}
                            >
                                Voir toutes les alertes
                            </Button>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-6 w-[1px] bg-border mx-2" />

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-12 gap-3 px-2 pr-4 rounded-2xl hover:bg-muted/50 transition-all group">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-sm group-hover:scale-105 transition-transform">
                                    {userInitials}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-sm font-bold text-foreground capitalize truncate leading-none mb-1">
                                        Maître {userName}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-60">
                                        Niang
                                    </span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 rounded-[32px] p-3 shadow-2xl border-border/50 animate-fade-in backdrop-blur-xl bg-background/95">
                            <div className="flex items-center gap-4 p-4 pb-2">
                                <div className="h-16 w-16 rounded-[22px] bg-zinc-900 flex items-center justify-center text-white font-black text-2xl border-4 border-background shadow-xl">
                                    {userInitials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="font-black text-lg text-foreground truncate capitalize tracking-tight">Maître {userName} Niang</p>
                                    <p className="text-[10px] text-muted-foreground truncate font-black tracking-widest uppercase opacity-40">{user?.email}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="my-4 mx-2 opacity-30" />
                            <div className="space-y-1">
                                <DropdownMenuItem
                                    className="rounded-2xl py-3 px-4 font-bold flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                                    onClick={() => navigate('/profil')}
                                >
                                    <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                                        <User className="h-4 w-4 opacity-70" />
                                    </div>
                                    <span>Mon Profil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="rounded-2xl py-3 px-4 font-bold flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                                    onClick={() => navigate('/parametres')}
                                >
                                    <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                                        <Settings className="h-4 w-4 opacity-70" />
                                    </div>
                                    <span>Paramètres</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-2xl py-3 px-4 font-bold flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all">
                                    <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                                        <CheckCheck className="h-4 w-4 opacity-70" />
                                    </div>
                                    <span>Mes Rapports</span>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator className="my-4 mx-2 opacity-30" />
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="rounded-2xl py-4 px-4 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-destructive hover:bg-destructive/5 cursor-pointer"
                            >
                                <LogOut className="h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
