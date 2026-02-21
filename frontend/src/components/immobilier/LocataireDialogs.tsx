import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { LocataireComplete, useUpdateLocataire } from '@/hooks/useLocataires';
import { useCreateLocataire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

const TYPE_PIECE_OPTIONS = [
    { value: 'CNI', label: 'Carte d\'Identité Nationale' },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'PERMIS', label: 'Permis de conduire' },
    { value: 'CARTE_CONSULAIRE', label: 'Carte Consulaire' },
    { value: 'AUTRE', label: 'Autre' },
];

const SITUATION_FAMILIALE_OPTIONS = [
    { value: 'CELIBATAIRE', label: 'Célibataire' },
    { value: 'MARIE', label: 'Marié(e)' },
    { value: 'DIVORCE', label: 'Divorcé(e)' },
    { value: 'VEUF', label: 'Veuf/Veuve' },
];

interface EditLocataireDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    locataire: LocataireComplete | null;
}

interface CreateLocataireDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    userId?: string | null;
}

export function CreateLocataireDialog({ open, onOpenChange, onSuccess, userId }: CreateLocataireDialogProps) {
    const createLocataire = useCreateLocataire();

    const [formData, setFormData] = useState({
        nom: '',
        telephone: '',
        email: '',
    });

    useEffect(() => {
        if (open) {
            setFormData({
                nom: '',
                telephone: '',
                email: '',
            });
        }
    }, [open]);

    const handleCreate = async () => {
        if (!formData.nom.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        createLocataire.mutate({
            nom: formData.nom,
            telephone: formData.telephone || null,
            email: formData.email || null,
            created_by: userId || null,
        }, {
            onSuccess: () => {
                onOpenChange(false);
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouveau Locataire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nom">Nom complet *</Label>
                        <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Ex: Jean Dupont"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                            id="telephone"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            placeholder="Ex: 77 123 45 67"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Ex: jean.dupont@email.com"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleCreate} disabled={createLocataire.isPending}>Créer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function EditLocataireDialog({ open, onOpenChange, locataire }: EditLocataireDialogProps) {
    const updateLocataire = useUpdateLocataire();
    const [formData, setFormData] = useState<Partial<LocataireComplete>>({});

    useEffect(() => {
        if (locataire) {
            setFormData({
                nom: locataire.nom || '',
                telephone: locataire.telephone || '',
                email: locataire.email || '',
                adresse: locataire.adresse || '',
                profession: locataire.profession || '',
                lieu_travail: locataire.lieu_travail || '',
                type_piece_identite: locataire.type_piece_identite || '',
                numero_piece_identite: locataire.numero_piece_identite || '',
                nationalite: locataire.nationalite || '',
                date_naissance: locataire.date_naissance || '',
                situation_familiale: locataire.situation_familiale || '',
                personne_contact_urgence: locataire.personne_contact_urgence || '',
                telephone_urgence: locataire.telephone_urgence || '',
                notes: locataire.notes || '',
            });
        }
    }, [locataire]);

    const handleUpdate = async () => {
        if (!locataire) return;
        updateLocataire.mutate({
            id: locataire.id,
            ...formData,
        }, {
            onSuccess: () => onOpenChange(false),
        });
    };

    if (!locataire) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Modifier le locataire</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="edit-nom">Nom complet *</Label>
                        <Input
                            id="edit-nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-telephone">Téléphone</Label>
                        <Input
                            id="edit-telephone"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="edit-adresse">Adresse</Label>
                        <Input
                            id="edit-adresse"
                            value={formData.adresse}
                            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-profession">Profession</Label>
                        <Input
                            id="edit-profession"
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-lieu_travail">Lieu de travail</Label>
                        <Input
                            id="edit-lieu_travail"
                            value={formData.lieu_travail}
                            onChange={(e) => setFormData({ ...formData, lieu_travail: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-type_piece_identite">Type de pièce d'identité</Label>
                        <Select
                            value={formData.type_piece_identite || undefined}
                            onValueChange={(v) => setFormData({ ...formData, type_piece_identite: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_PIECE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="edit-numero_piece_identite">Numéro de pièce d'identité</Label>
                        <Input
                            id="edit-numero_piece_identite"
                            value={formData.numero_piece_identite}
                            onChange={(e) => setFormData({ ...formData, numero_piece_identite: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-nationalite">Nationalité</Label>
                        <Input
                            id="edit-nationalite"
                            value={formData.nationalite}
                            onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-date_naissance">Date de naissance</Label>
                        <Input
                            id="edit-date_naissance"
                            type="date"
                            value={formData.date_naissance || ''}
                            onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-situation_familiale">Situation familiale</Label>
                        <Select
                            value={formData.situation_familiale || undefined}
                            onValueChange={(v) => setFormData({ ...formData, situation_familiale: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SITUATION_FAMILIALE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="edit-personne_contact_urgence">Contact d'urgence</Label>
                        <Input
                            id="edit-personne_contact_urgence"
                            value={formData.personne_contact_urgence}
                            onChange={(e) => setFormData({ ...formData, personne_contact_urgence: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-telephone_urgence">Téléphone d'urgence</Label>
                        <Input
                            id="edit-telephone_urgence"
                            value={formData.telephone_urgence}
                            onChange={(e) => setFormData({ ...formData, telephone_urgence: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                            id="edit-notes"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleUpdate} disabled={updateLocataire.isPending}>
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
