import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateResultatAudience } from '@/hooks/useAudiences';

interface AudienceInfo {
  reference: string;
  intitule: string;
  date: string;
  juridiction: string;
}

interface ResultatAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audienceId?: string;
  audienceInfo?: AudienceInfo;
}

export function ResultatAudienceDialog({
  open,
  onOpenChange,
  audienceId,
  audienceInfo,
}: ResultatAudienceDialogProps) {
  const createResultat = useCreateResultatAudience();

  const [formData, setFormData] = useState({
    type: 'RENVOI' as 'RENVOI' | 'RADIATION' | 'DELIBERE',
    nouvelleDate: '',
    commentaire: '',
  });

  const resetForm = () => {
    setFormData({ type: 'RENVOI', nouvelleDate: '', commentaire: '' });
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienceId) return toast.error("ID d'audience manquant");

    if (formData.type === 'RENVOI' && !formData.nouvelleDate) {
      return toast.error('La nouvelle date est obligatoire pour un renvoi');
    }
    if (!formData.commentaire && formData.type !== 'RENVOI') {
      return toast.error('Le motif ou texte est obligatoire');
    }

    try {
      await createResultat.mutateAsync({
        audienceId,
        data: {
          type: formData.type,
          nouvelleDate: formData.nouvelleDate || undefined,
          motifRenvoi: formData.type === 'RENVOI' ? formData.commentaire : undefined,
          motifRadiation: formData.type === 'RADIATION' ? formData.commentaire : undefined,
          texteDelibere: formData.type === 'DELIBERE' ? formData.commentaire : undefined,
        }
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (!audienceInfo) return null;

  const config = {
    RENVOI: {
      label: "Motif du renvoi",
      placeholder: "Préciser le motif du renvoi (optionnel)...",
      color: "bg-muted/30",
      focusRing: "focus:ring-primary/20"
    },
    RADIATION: {
      label: "Motif de radiation",
      placeholder: "Expliquez les raisons de la radiation...",
      color: "bg-destructive/5",
      focusRing: "focus:ring-destructive/20"
    },
    DELIBERE: {
      label: "Texte du délibéré",
      placeholder: "Saisissez le texte intégral du délibéré...",
      color: "bg-primary/5",
      focusRing: "focus:ring-primary/20"
    }
  }[formData.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b bg-background z-10">
          <DialogTitle className="text-xl font-semibold tracking-tight">Résultat d'audience</DialogTitle>
          <DialogDescription className="text-sm">Enregistrez le résultat pour mettre à jour le dossier.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
            {/* Info Card */}
            <div className="bg-muted/40 rounded-xl p-4 border border-border/50 text-sm space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-foreground">{audienceInfo.reference}</span>
                <span className="text-muted-foreground tabular-nums">
                  {new Date(audienceInfo.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-muted-foreground truncate leading-relaxed">{audienceInfo.intitule}</p>
            </div>

            <div className="space-y-4">
              {/* Result Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                  Type de résultat *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: 'RENVOI' | 'RADIATION' | 'DELIBERE') => setFormData({ ...formData, type: v, commentaire: '' })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none focus:ring-1 focus:ring-primary/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-border/50">
                    <SelectItem value="RENVOI" className="rounded-lg my-0.5">Renvoi</SelectItem>
                    <SelectItem value="RADIATION" className="rounded-lg my-0.5 text-destructive focus:text-destructive">Radiation</SelectItem>
                    <SelectItem value="DELIBERE" className="rounded-lg my-0.5">Délibéré</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Date for RENVOI */}
              {formData.type === 'RENVOI' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                    Nouvelle date *
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.nouvelleDate}
                      onChange={(e) => setFormData({ ...formData, nouvelleDate: e.target.value })}
                      className="h-12 rounded-xl bg-muted/30 border-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Comment/Text Field */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">
                  {config.label} {formData.type !== 'RENVOI' && '*'}
                </Label>
                <Textarea
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  placeholder={config.placeholder}
                  className={`min-h-[140px] rounded-xl border-none p-4 resize-none transition-all ${config.color} ${config.focusRing}`}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-muted/10 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-muted/50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createResultat.isPending}
              className="rounded-xl px-8 shadow-lg shadow-primary/10"
            >
              {createResultat.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}