import { useState } from 'react';
import { User, Lock, Clock, Settings } from 'lucide-react';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';

import { ProfileHero } from './profile/ProfileHero';
import { ProfileNav } from './profile/ProfileNav';
import { PersonalInfoTab } from './profile/tabs/PersonalInfoTab';
import { SecurityTab } from './profile/tabs/SecurityTab';
import { ActivityTab } from './profile/tabs/ActivityTab';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NAV_ITEMS = [
    { id: 'info', label: 'Informations', icon: User, desc: 'Détails personnels' },
    { id: 'security', label: 'Sécurité', icon: Lock, desc: 'Mot de passe & Accès' },
    { id: 'activity', label: 'Activité', icon: Clock, desc: 'Historique des connexions' },
    { id: 'settings', label: 'Préférences', icon: Settings, desc: 'Notifications & Interface' },
];

export default function ProfilePage() {
    const { user, roles, signOut } = useNestJSAuth();
    const [activeTab, setActiveTab] = useState('info');

    if (!user) return null;

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Mon Profil"
                description="Gérez vos informations personnelles et vos paramètres de sécurité"
            />

            <div className="p-6 lg:p-8 space-y-8">
                <ProfileHero user={user} roles={roles} onSignOut={signOut} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <ProfileNav items={NAV_ITEMS} activeId={activeTab} onSelect={setActiveTab} />
                    </div>

                    <div className="lg:col-span-9">
                        <Tabs value={activeTab} className="w-full">
                            <TabsContent value="info" className="mt-0 focus-visible:outline-none">
                                <PersonalInfoTab user={user} roles={roles} />
                            </TabsContent>

                            <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                                <SecurityTab />
                            </TabsContent>

                            <TabsContent value="activity" className="mt-0 focus-visible:outline-none">
                                <ActivityTab user={user} />
                            </TabsContent>

                            <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                                <Card className="border-border/40 overflow-hidden rounded-[24px] shadow-sm">
                                    <CardHeader className="p-8">
                                        <div className="flex items-center gap-4 mb-2 text-muted-foreground/30"><Settings className="h-12 w-12" /></div>
                                        <CardTitle className="text-xl font-black tracking-tight">Préférences bientôt disponibles</CardTitle>
                                        <CardDescription className="text-sm font-medium leading-relaxed max-w-md">
                                            Nous travaillons sur une nouvelle interface pour personnaliser votre expérience.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
