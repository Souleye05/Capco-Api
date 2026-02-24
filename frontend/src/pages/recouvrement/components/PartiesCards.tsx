import { Card, CardContent } from '@/components/ui/card';
import { Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { DossierRecouvrement } from '@/hooks/useRecouvrement';

export const PartiesCards = ({ dossier }: { dossier: DossierRecouvrement }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PartyCard
            title="Créancier"
            name={dossier.creancierNom}
            icon={<Building2 className="h-6 w-6" />}
            data={[{ icon: <Phone />, value: dossier.creancierTelephone }, { icon: <Mail />, value: dossier.creancierEmail }]}
            headerColor="bg-indigo-50/50"
            titleColor="text-indigo-700"
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
        />
        <PartyCard
            title="Débiteur"
            name={dossier.debiteurNom}
            icon={<User className="h-6 w-6" />}
            data={[
                { icon: <Phone />, value: dossier.debiteurTelephone },
                { icon: <Mail />, value: dossier.debiteurEmail },
                { icon: <MapPin />, value: dossier.debiteurAdresse }
            ]}
            headerColor="bg-amber-50/50"
            titleColor="text-amber-700"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
        />
    </div>
);

const PartyCard = ({ title, name, icon, data, headerColor, titleColor, iconBg, iconColor }: any) => (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className={`${headerColor} p-3 border-b border-slate-100`}>
            <h3 className={`text-xs font-bold ${titleColor} uppercase flex items-center gap-2`}>
                {icon} {title}
            </h3>
        </div>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="font-bold text-slate-900">{name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {data.map((item: any, i: number) => item.value && (
                        <span key={i} className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            {React.cloneElement(item.icon, { className: "h-3 w-3" })} {item.value}
                        </span>
                    ))}
                </div>
            </div>
        </CardContent>
    </Card>
);

import React from 'react';
