import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocataireComplete, useUpdateLocataire } from '@/hooks/useLocataires';
import { useCreateLocataire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';
import { User, Phone, Mail, MapPin, Briefcase, FileDigit, Globe, Heart, AlertCircle, Loader2, Hash } from 'lucide-react';

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
                toast.success('Locataire créé avec succès');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <User className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nouveau Profil</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Ajouter un locataire</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Renseignez les informations de base du futur occupant.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="nom" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Nom complet <span className="text-primary">*</span></Label>
                        <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="nom"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                placeholder="Ex: Jean Dupont"
                                className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="telephone" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Téléphone</Label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    placeholder="77 123 45 67"
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="exemple@email.com"
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleCreate} disabled={createLocataire.isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {createLocataire.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Créer le profil'}
                    </Button>
                </div>
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
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Profil mis à jour');
            },
        });
    };

    if (!locataire) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <User className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Édition Profil</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Modifier le locataire</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Mettez à jour les informations détaillées du locataire.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="edit-nom" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Nom complet <span className="text-primary">*</span></Label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-nom"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-telephone" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Téléphone</Label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-email" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="edit-adresse" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Adresse</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-adresse"
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-profession" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Profession</Label>
                            <div className="relative group">
                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-profession"
                                    value={formData.profession}
                                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-lieuTravail" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Lieu de travail</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-lieuTravail"
                                    value={formData.lieuTravail}
                                    onChange={(e) => setFormData({ ...formData, lieuTravail: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-typePieceIdentite" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Pièce d'identité</Label>
                            <div className="relative group">
                                <FileDigit className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    value={formData.typePieceIdentite || ""}
                                    onValueChange={(v) => setFormData({ ...formData, typePieceIdentite: v })}
                                    options={TYPE_PIECE_OPTIONS}
                                    placeholder="Type de pièce..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-numeroPieceIdentite" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">N° de pièce</Label>
                            <div className="relative group">
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-numeroPieceIdentite"
                                    value={formData.numeroPieceIdentite}
                                    onChange={(e) => setFormData({ ...formData, numeroPieceIdentite: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-nationalite" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Nationalité</Label>
                            <div className="relative group">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-nationalite"
                                    value={formData.nationalite}
                                    onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-dateNaissance" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date de naissance</Label>
                            <Input
                                id="edit-dateNaissance"
                                type="date"
                                value={formData.dateNaissance || ''}
                                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                                className="h-11 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-situationFamiliale" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Situation familiale</Label>
                            <div className="relative group">
                                <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    value={formData.situationFamiliale || ""}
                                    onValueChange={(v) => setFormData({ ...formData, situationFamiliale: v })}
                                    options={SITUATION_FAMILIALE_OPTIONS}
                                    placeholder="Situation..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-personneContactUrgence" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Contact d'urgence</Label>
                            <div className="relative group">
                                <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-personneContactUrgence"
                                    value={formData.personneContactUrgence}
                                    onChange={(e) => setFormData({ ...formData, personneContactUrgence: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-telephoneUrgence" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Tél. d'urgence</Label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="edit-telephoneUrgence"
                                    value={formData.telephoneUrgence}
                                    onChange={(e) => setFormData({ ...formData, telephoneUrgence: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="edit-notes" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Notes complémentaires</Label>
                            <Textarea
                                id="edit-notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="min-h-[100px] rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium resize-none shadow-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleUpdate} disabled={updateLocataire.isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {updateLocataire.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
