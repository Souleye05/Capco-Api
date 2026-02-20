import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Users,
  Shield,
  ShieldCheck,
  Calculator,
  Clock,
  Search,
  Filter,
  UserPlus,
  Loader2,
  MoreVertical,
  UserCheck,
  UserMinus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { useUsers } from '@/hooks/useUsers';

type AppRole = 'admin' | 'collaborateur' | 'compta';

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrateur', icon: ShieldCheck, color: 'bg-destructive/10 text-destructive' },
  collaborateur: { label: 'Collaborateur', icon: Users, color: 'bg-primary/10 text-primary' },
  compta: { label: 'Comptabilité', icon: Calculator, color: 'bg-success/10 text-success' },
};

export default function UsersPage() {
  const { user: currentUser } = useNestJSAuth();
  const { data: usersData, loading, createUser, assignRole, deleteUser } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('collaborateur');
  const [creating, setCreating] = useState(false);

  const users = usersData?.users || [];

  // Stats calculation
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.emailVerified || u.id).length, // Simplified for mock
    inactifs: 0, // Simplified for mock
    admins: users.filter(u => u.roles?.includes('admin')).length,
    collaborateurs: users.filter(u => u.roles?.includes('collaborateur')).length,
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.roles?.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'actif' ? true : false); // Simplified
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setCreating(true);
    try {
      const result = await createUser({
        email: newUserEmail,
        password: newUserPassword,
        roles: [newUserRole],
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Utilisateur ${newUserEmail} créé avec succès`);
        setCreateDialogOpen(false);
        setNewUserEmail('');
        setNewUserPassword('');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (userId: string, action: 'delete' | 'admin' | 'collab' | 'compta') => {
    try {
      if (action === 'delete') {
        await deleteUser(userId);
        toast.success('Utilisateur supprimé');
      } else {
        const role = action === 'admin' ? 'admin' : action === 'collab' ? 'collaborateur' : 'compta';
        await assignRole(userId, role);
        toast.success('Rôle mis à jour');
      }
    } catch (e) {
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Header & Welcome Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2 px-1">
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/10 shadow-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">Bonjour,</p>
              <h2 className="text-xl font-black text-foreground tracking-tight">Maître</h2>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-foreground mt-6">
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground text-lg mt-2 font-medium opacity-80">
            Gérez les comptes utilisateurs et les permissions du cabinet
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-8 rounded-[20px] gap-3 shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:scale-[1.02] transition-all active:scale-95">
              <UserPlus className="h-5 w-5" />
              <span className="font-bold">Nouvel utilisateur</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] border-border/50 p-8 shadow-2xl backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un utilisateur</DialogTitle>
              <DialogDescription className="text-base font-medium">
                Créez un nouveau compte utilisateur avec un rôle spécifique.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold ml-1">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all"
                  placeholder="nom@maitre-niang.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold ml-1">Mot de passe provisoire</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-12 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all"
                  placeholder="Minimum 6 caractères"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-bold ml-1">Rôle initial</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                  <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-lg">
                    <SelectItem value="admin" className="rounded-xl my-1">Administrateur</SelectItem>
                    <SelectItem value="collaborateur" className="rounded-xl my-1">Collaborateur</SelectItem>
                    <SelectItem value="compta" className="rounded-xl my-1">Comptabilité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="h-12 rounded-2xl flex-1 font-bold">
                Annuler
              </Button>
              <Button onClick={handleCreateUser} disabled={creating} className="h-12 rounded-2xl flex-[2] font-bold shadow-lg shadow-primary/10">
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer la création
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'TOTAL', value: stats.total, icon: Users, color: 'text-foreground', bg: 'bg-card' },
          { label: 'ACTIFS', value: stats.actifs, icon: ShieldCheck, color: 'text-success', bg: 'bg-success/5 border-success/20 shadow-success/5' },
          { label: 'INACTIFS', value: stats.inactifs, icon: Clock, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20 shadow-destructive/5' },
          { label: 'ADMINS', value: stats.admins, icon: Shield, color: 'text-primary', bg: 'bg-primary/5 border-primary/20 shadow-primary/5' },
          { label: 'COLLABORATEURS', value: stats.collaborateurs, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted/30 border-muted/50' },
        ].map((stat, i) => (
          <div key={i} className={cn("group border-2 shadow-sm rounded-[32px] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2", stat.bg)}>
            <div className="flex items-center gap-5">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-110", stat.color.replace('text', 'border'))}>
                <stat.icon className={cn("h-7 w-7", stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] line-clamp-1">{stat.label}</p>
                <p className="text-3xl font-black tabular-nums tracking-tighter">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter Bar */}
      <Card className="rounded-[40px] border-border/40 shadow-xl bg-card/60 backdrop-blur-2xl p-2 transition-all hover:bg-card/80">
        <div className="flex flex-col lg:flex-row items-center gap-3 p-2">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Rechercher par nom ou email..."
              className="h-14 pl-14 bg-background/50 border-none rounded-[30px] text-base font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/10 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-14 rounded-[30px] border-none bg-background/50 font-bold px-6">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-border/50 p-2">
                <SelectItem value="all" className="rounded-2xl py-3 px-4 font-bold">Tous les rôles</SelectItem>
                <SelectItem value="admin" className="rounded-2xl py-3 px-4 font-bold text-destructive">Admin</SelectItem>
                <SelectItem value="collaborateur" className="rounded-2xl py-3 px-4 font-bold text-primary">Collaborateur</SelectItem>
                <SelectItem value="compta" className="rounded-2xl py-3 px-4 font-bold text-success">Compta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-14 rounded-[30px] border-none bg-background/50 font-bold px-6">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-border/50 p-2">
                <SelectItem value="all" className="rounded-2xl py-3 px-4 font-bold">Tous les statuts</SelectItem>
                <SelectItem value="actif" className="rounded-2xl py-3 px-4 font-bold text-success">Actif</SelectItem>
                <SelectItem value="inactif" className="rounded-2xl py-3 px-4 font-bold text-muted-foreground">Inactif</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-background/50 hidden sm:flex shrink-0 border-none transition-transform hover:rotate-12">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Users Table */}
      <Card className="rounded-[48px] border-border/40 shadow-2xl overflow-hidden bg-card transition-all">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Utilisateur</TableHead>
              <TableHead className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rôle</TableHead>
              <TableHead className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Statut</TableHead>
              <TableHead className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dernière connexion</TableHead>
              <TableHead className="py-8 px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-96 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground opacity-50 tracking-widest uppercase">Chargement des comptes...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-96 text-center">
                  <div className="flex flex-col items-center gap-4 py-20">
                    <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground opacity-30" />
                    </div>
                    <p className="text-xl font-bold text-muted-foreground opacity-50">Aucun collaborateur trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u, i) => {
                const primaryRole = u.roles?.[0] || 'collaborateur';
                const roleInfo = roleLabels[primaryRole] || roleLabels.collaborateur;
                const RoleIcon = roleInfo.icon;
                const initials = u.email.substring(0, 1).toUpperCase();
                const userName = u.email.split('@')[0].replace('.', ' ');

                return (
                  <TableRow key={u.id} className={cn("group border-b border-border/30 hover:bg-primary/[0.02] transition-colors", i === filteredUsers.length - 1 && "border-none")}>
                    <TableCell className="py-7 px-10">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-muted/50 flex items-center justify-center font-black text-2xl text-foreground border-2 border-border/50 shadow-md group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-lg text-foreground capitalize truncate leading-tight tracking-tight">
                            {userName}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground truncate opacity-60 m-0.5">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-7 px-8">
                      <div className={cn("inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 font-black text-[11px] uppercase tracking-wider transition-all group-hover:shadow-md", roleInfo.color, roleInfo.color.replace('/10', '/30'))}>
                        <RoleIcon className="h-4 w-4" />
                        {roleInfo.label}
                      </div>
                    </TableCell>
                    <TableCell className="py-7 px-8">
                      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-[11px] font-black uppercase tracking-widest", u.emailVerified || true ? 'bg-success/5 text-success border-success/20' : 'bg-destructive/5 text-destructive border-destructive/20')}>
                        <div className={cn("h-2 w-2 rounded-full", u.emailVerified || true ? "bg-success animate-pulse" : "bg-destructive")} />
                        {u.emailVerified || true ? 'Actif' : 'Inactif'}
                      </div>
                    </TableCell>
                    <TableCell className="py-7 px-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-foreground font-bold">
                          <Clock className="h-3.5 w-3.5 opacity-30" />
                          <span className="text-base tracking-tighter">
                            {u.createdAt ? format(new Date(u.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'Jamais'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-muted-foreground opacity-30 ml-5">
                          {u.createdAt ? format(new Date(u.createdAt), 'HH:mm:ss', { locale: fr }) : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-7 px-10 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group-hover:shadow-sm">
                            <MoreVertical className="h-6 w-6 opacity-40 group-hover:opacity-100" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 rounded-3xl p-3 shadow-2xl border-border/50 animate-fade-in">
                          <DropdownMenuLabel className="font-black text-[10px] uppercase text-muted-foreground tracking-widest px-4 py-3">Rôles système</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleAction(u.id, 'admin')} className="rounded-[14px] py-3 px-4 font-bold flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-destructive" />
                            Passer Administrateur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(u.id, 'collab')} className="rounded-[14px] py-3 px-4 font-bold flex items-center gap-3">
                            <UserCheck className="h-4 w-4 text-primary" />
                            Passer Collaborateur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(u.id, 'compta')} className="rounded-[14px] py-3 px-4 font-bold flex items-center gap-3">
                            <Calculator className="h-4 w-4 text-success" />
                            Passer Comptabilité
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 bg-border/40" />
                          <DropdownMenuLabel className="font-black text-[10px] uppercase text-muted-foreground tracking-widest px-4 py-3">Actions rapides</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-[14px] py-3 px-4 font-bold flex items-center gap-3 text-muted-foreground">
                            <UserMinus className="h-4 w-4" />
                            Désactiver le compte
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(u.id, 'delete')} className="rounded-[14px] py-3 px-4 font-bold flex items-center gap-3 text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-4 w-4" />
                            Supprimer définitivement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
