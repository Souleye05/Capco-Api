import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'collaborateur' | 'compta';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  user_email: string | null;
  action: string;
  module: string;
  entity_type: string;
  entity_reference: string | null;
  created_at: string;
  details: unknown;
}

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrateur', icon: ShieldCheck, color: 'bg-destructive/10 text-destructive' },
  collaborateur: { label: 'Collaborateur', icon: Users, color: 'bg-primary/10 text-primary' },
  compta: { label: 'Comptabilité', icon: Calculator, color: 'bg-success/10 text-success' },
};

const moduleLabels: Record<string, string> = {
  contentieux: 'Contentieux',
  recouvrement: 'Recouvrement',
  immobilier: 'Immobilier',
  conseil: 'Conseil',
  system: 'Système',
};

export default function UsersPage() {
  const { user: currentUser, session } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  
  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('collaborateur');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [session]);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const validRoles: AppRole[] = ['admin', 'collaborateur', 'compta'];
    if (!validRoles.includes(newRole as AppRole)) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as AppRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Rôle mis à jour');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setCreating(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la création');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Utilisateur ${newUserEmail} créé avec succès`);
      setCreateDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('collaborateur');
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="min-h-screen">
      <Header 
        title="Administration" 
        subtitle="Gestion des utilisateurs et journal d'activité"
      />

      <div className="p-6 animate-fade-in space-y-6">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs ({users.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Clock className="h-4 w-4" />
              Journal d'activité ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Utilisateurs */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Nouvel utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer un utilisateur</DialogTitle>
                        <DialogDescription>
                          Créez un nouveau compte utilisateur avec un rôle spécifique.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="utilisateur@exemple.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Mot de passe</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Minimum 6 caractères"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Rôle</Label>
                          <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrateur</SelectItem>
                              <SelectItem value="collaborateur">Collaborateur</SelectItem>
                              <SelectItem value="compta">Comptabilité</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleCreateUser} disabled={creating}>
                          {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Créer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun utilisateur inscrit pour le moment</p>
                    <p className="text-sm mt-2">
                      Cliquez sur "Nouvel utilisateur" pour créer un compte
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Date d'inscription</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const roleInfo = roleLabels[user.role] || roleLabels.collaborateur;
                        const RoleIcon = roleInfo.icon;
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={roleInfo.color}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleChangeRole(user.id, value)}
                                disabled={user.id === currentUser?.id}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrateur</SelectItem>
                                  <SelectItem value="collaborateur">Collaborateur</SelectItem>
                                  <SelectItem value="compta">Comptabilité</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Journal d'activité */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Journal d'activité
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les modules</SelectItem>
                        <SelectItem value="contentieux">Contentieux</SelectItem>
                        <SelectItem value="recouvrement">Recouvrement</SelectItem>
                        <SelectItem value="immobilier">Immobilier</SelectItem>
                        <SelectItem value="conseil">Conseil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune activité enregistrée</p>
                    <p className="text-sm mt-2">
                      Les actions des utilisateurs apparaîtront ici
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.user_email || 'Inconnu'}
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {moduleLabels[log.module] || log.module}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.entity_reference || log.entity_type}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
