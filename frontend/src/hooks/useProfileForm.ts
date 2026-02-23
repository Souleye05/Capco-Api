import { useState } from 'react';
import { toast } from 'sonner';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';

export function useProfileForm() {
    const { changePassword } = useNestJSAuth();
    const [isPending, setIsPending] = useState(false);
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const updateField = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const submitPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            return toast.error('Les nouveaux mots de passe ne correspondent pas');
        }

        if (form.newPassword.length < 8) {
            return toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
        }

        setIsPending(true);
        try {
            const { error, message } = await changePassword(form.currentPassword, form.newPassword);
            if (error) {
                toast.error(error);
            } else {
                toast.success(message || 'Mot de passe modifié avec succès');
                resetForm();
            }
        } catch (err) {
            toast.error('Une erreur est survenue');
        } finally {
            setIsPending(false);
        }
    };

    return { form, isPending, updateField, submitPasswordChange };
}
