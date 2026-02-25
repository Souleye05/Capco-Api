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
                lieuTravail: locataire.lieuTravail || '',
                typePieceIdentite: locataire.typePieceIdentite || '',
                numeroPieceIdentite: locataire.numeroPieceIdentite || '',
                nationalite: locataire.nationalite || '',
                dateNaissance: locataire.dateNaissance || '',
                situationFamiliale: locataire.situationFamiliale || '',
                personneContactUrgence: locataire.personneContactUrgence || '',
                telephoneUrgence: locataire.telephoneUrgence || '',
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
                        <Label htmlFor="edit-lieuTravail">Lieu de travail</Label>
                        <Input
                            id="edit-lieuTravail"
                            value={formData.lieuTravail}
                            onChange={(e) => setFormData({ ...formData, lieuTravail: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-typePieceIdentite">Type de pièce d'identité</Label>
                        <Select
                            value={formData.typePieceIdentite || undefined}
                            onValueChange={(v) => setFormData({ ...formData, typePieceIdentite: v })}
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
                        <Label htmlFor="edit-numeroPieceIdentite">Numéro de pièce d'identité</Label>
                        <Input
                            id="edit-numeroPieceIdentite"
                            value={formData.numeroPieceIdentite}
                            onChange={(e) => setFormData({ ...formData, numeroPieceIdentite: e.target.value })}
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
                        <Label htmlFor="edit-dateNaissance">Date de naissance</Label>
                        <Input
                            id="edit-dateNaissance"
                            type="date"
                            value={formData.dateNaissance || ''}
                            onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-situationFamiliale">Situation familiale</Label>
                        <Select
                            value={formData.situationFamiliale || undefined}
                            onValueChange={(v) => setFormData({ ...formData, situationFamiliale: v })}
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
                        <Label htmlFor="edit-personneContactUrgence">Contact d'urgence</Label>
                        <Input
                            id="edit-personneContactUrgence"
                            value={formData.personneContactUrgence}
                            onChange={(e) => setFormData({ ...formData, personneContactUrgence: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-telephoneUrgence">Téléphone d'urgence</Label>
                        <Input
                            id="edit-telephoneUrgence"
                            value={formData.telephoneUrgence}
                            onChange={(e) => setFormData({ ...formData, telephoneUrgence: e.target.value })}
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

