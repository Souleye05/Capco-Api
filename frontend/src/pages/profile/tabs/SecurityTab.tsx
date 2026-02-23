import { Lock, Key, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useProfileForm } from '@/hooks/useProfileForm';

export function SecurityTab() {
    const { form, isPending, updateField, submitPasswordChange } = useProfileForm();

    return (
        <Card className="border-border/40 overflow-hidden rounded-[24px] shadow-sm">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" /> Sécurité & Accès
                </CardTitle>
                <CardDescription className="text-sm font-medium">Modifiez votre mot de passe pour sécuriser votre compte</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <form onSubmit={submitPasswordChange} className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Mot de passe actuel</Label>
                        <div className="relative">
                            <Input
                                type="password"
                                value={form.currentPassword}
                                onChange={e => updateField('currentPassword', e.target.value)}
                                className="h-12 rounded-xl pl-11 bg-muted/20 focus:bg-background transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Nouveau mot de passe</Label>
                            <Input
                                type="password"
                                value={form.newPassword}
                                onChange={e => updateField('newPassword', e.target.value)}
                                className="h-12 rounded-xl bg-muted/20 focus:bg-background transition-all"
                                placeholder="Minimum 8 caractères"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Confirmer le nouveau</Label>
                            <Input
                                type="password"
                                value={form.confirmPassword}
                                onChange={e => updateField('confirmPassword', e.target.value)}
                                className="h-12 rounded-xl bg-muted/20 focus:bg-background transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs flex gap-3 leading-relaxed font-medium">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>Un mot de passe fort contient des majuscules, des chiffres et des caractères spéciaux. Évitez d'utiliser des informations personnelles.</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="rounded-2xl h-12 w-full md:w-auto px-8 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20"
                    >
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Mettre à jour mot de passe
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
