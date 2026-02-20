import { useState } from 'react';
import { UserPlus, Mail, Lock, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserModalsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  selectedUser: any;
  onCreate: (userData: any) => void;
  creating: boolean;
}

export const UserModals = ({
  createOpen,
  setCreateOpen,
  editOpen,
  setEditOpen,
  selectedUser,
  onCreate,
  creating,
}: UserModalsProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    roles: ['collaborateur'],
  });

  const handleCreate = () => {
    onCreate(formData);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      roles: ['collaborateur'],
    });
  };

  return (
    <>
      {/* Modal de création */}
      <Dialog 
        open={createOpen} 
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nouvel utilisateur
            </DialogTitle>
            <DialogDescription>
              Créer un nouveau compte utilisateur pour votre cabinet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@cabinet.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe temporaire"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rôle
              </Label>
              <Select 
                value={formData.roles[0]} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, roles: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="collaborateur">Collaborateur</SelectItem>
                  <SelectItem value="compta">Comptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formData.email || !formData.password}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              La modification des utilisateurs sera disponible dans une prochaine version.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};