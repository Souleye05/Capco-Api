import { parseDateFromAPI } from '@/lib/date-utils';
import {
    Users,
    Shield,
    Mail,
    Calendar as CalendarIcon,
    Clock,
    MoreVertical,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface UserTableProps {
    users: any[];
    loading: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: string) => void;
    onEdit: (user: any) => void;
    onAction: (userId: string, action: any) => void;
}

export const UserTable = ({ users, loading, sortBy, sortOrder, onSort, onEdit, onAction }: UserTableProps) => {
    if (loading) {
        return (
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="px-6">Utilisateur</TableHead>
                        <TableHead className="px-6">Rôle</TableHead>
                        <TableHead className="px-6">Statut</TableHead>
                        <TableHead className="px-6 text-right">Dernière connexion</TableHead>
                        <TableHead className="px-6 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5} className="h-16 animate-pulse">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-[150px] bg-muted rounded" />
                                        <div className="h-3 w-[100px] bg-muted rounded" />
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    if (users.length === 0) {
        return (
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="px-6">Utilisateur</TableHead>
                        <TableHead className="px-6">Rôle</TableHead>
                        <TableHead className="px-6">Statut</TableHead>
                        <TableHead className="px-6 text-right">Dernière connexion</TableHead>
                        <TableHead className="px-6 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            Aucun utilisateur trouvé
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }

    return (
        <Table>
            <TableHeader className="bg-muted/30">
                <TableRow>
                    <TableHead
                        className="px-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onSort('email')}
                    >
                        <div className="flex items-center gap-2">
                            Utilisateur
                            {sortBy === 'email' && (
                                <span className="text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </div>
                    </TableHead>
                    <TableHead className="px-6">Rôle</TableHead>
                    <TableHead className="px-6">Statut</TableHead>
                    <TableHead
                        className="px-6 cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => onSort('lastSignIn')}
                    >
                        <div className="flex items-center justify-end gap-2">
                            Dernière connexion
                            {sortBy === 'lastSignIn' && (
                                <span className="text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </div>
                    </TableHead>
                    <TableHead className="px-6 text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((u) => {
                    const role = u.roles?.[0] || 'collaborateur';
                    const isAdmin = role === 'admin';
                    const name = u.email.split('@')[0].replace('.', ' ');

                    return (
                        <TableRow key={u.id} className="group hover:bg-muted/20 transition-colors">
                            <TableCell className="px-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold transition-transform group-hover:scale-110">
                                        {u.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors capitalize">
                                            {name}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {u.email}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6">
                                {isAdmin ? (
                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Admin
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground border-muted transition-colors group-hover:bg-muted/50">
                                        <Users className="w-3 h-3 mr-1" />
                                        Collaborateur
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="px-6">
                                {u.emailVerified ? (
                                    <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        Actif
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
                                        <UserX className="w-3 h-3 mr-1" />
                                        Inactif
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="px-6 text-right">
                                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {u.lastSignIn ? new Intl.DateTimeFormat('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            timeZone: 'UTC'
                                        }).format(parseDateFromAPI(u.lastSignIn)) : 'Jamais'}
                                    </div>
                                    {u.lastSignIn && (
                                        <div className="flex items-center gap-1 opacity-70">
                                            <Clock className="h-3 w-3" />
                                            {new Intl.DateTimeFormat('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'UTC'
                                            }).format(parseDateFromAPI(u.lastSignIn))}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors hover:bg-primary/5 hover:text-primary">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px]">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onEdit(u)} className="flex items-center gap-2 cursor-pointer">
                                            <Edit className="h-4 w-4" /> Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction(u.id, 'admin')} className="flex items-center gap-2 cursor-pointer">
                                            <ShieldCheck className="h-4 w-4" /> Passer Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction(u.id, 'collab')} className="flex items-center gap-2 cursor-pointer">
                                            <Users className="h-4 w-4" /> Passer Collaborateur
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onAction(u.id, 'delete')} className="flex items-center gap-2 text-destructive cursor-pointer">
                                            <Trash2 className="h-4 w-4" /> Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
