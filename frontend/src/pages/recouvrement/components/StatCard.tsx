import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtext?: string;
    loading?: boolean;
}

export const StatCard = ({ title, value, icon, subtext, loading }: StatCardProps) => (
    <Card className="border-none shadow-sm bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            {icon && React.cloneElement(icon as React.ReactElement, { className: "h-12 w-12" })}
        </div>
        <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <Skeleton className="h-7 w-32" />
            ) : (
                <>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    {subtext && <p className="text-[10px] font-medium text-success mt-1 uppercase tracking-tight">{subtext}</p>}
                </>
            )}
        </CardContent>
    </Card>
);
