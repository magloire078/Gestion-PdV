
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Company } from "@/lib/types";

export default function SubscriptionsPage() {
    const firestore = useFirestore();
    const companiesRef = useMemoFirebase(() => collection(firestore, "companies"), [firestore]);
    const { data: companies, isLoading } = useCollection<Company>(companiesRef);

    const activeSubscriptions = companies?.filter(c => c.subscriptionStatus === 'active') || [];
    const expiringSoon = activeSubscriptions.filter(c => {
        const endDate = new Date(c.subscriptionEndDate);
        const diffTime = endDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
    });
    const expired = companies?.filter(c => {
        const endDate = new Date(c.subscriptionEndDate);
        return endDate.getTime() < new Date().getTime() && c.subscriptionStatus === 'active';
    }) || [];

    const stats = [
        {
            title: "Revenu Mensuel (MRR)",
            value: formatCurrency(activeSubscriptions.length * 29.99),
            icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
            description: `${activeSubscriptions.length} abonnements actifs`,
        },
        {
            title: "Expire Bientôt",
            value: expiringSoon.length.toString(),
            icon: <Calendar className="h-4 w-4 text-orange-500" />,
            description: "Dans les 7 prochains jours",
        },
        {
            title: "Expirés (Actifs)",
            value: expired.length.toString(),
            icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
            description: "Nécessite une action",
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Suivi des Abonnements</h1>
                <p className="text-sm text-muted-foreground">Surveillez la santé financière et les cycles de facturation.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Détails des Abonnements</CardTitle>
                    <CardDescription>Vue d'ensemble par entreprise.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entreprise</TableHead>
                                <TableHead>Date d'échéance</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Santé</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies?.map((company) => {
                                const endDate = new Date(company.subscriptionEndDate);
                                const isExpiring = expiringSoon.some(c => c.id === company.id);
                                const isExpired = new Date().getTime() > endDate.getTime();

                                return (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name}</TableCell>
                                        <TableCell>
                                            {endDate.toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={company.subscriptionStatus === 'active' ? 'default' : company.subscriptionStatus === 'trial' ? 'outline' : 'secondary'}>
                                                {company.subscriptionStatus === 'active' ? 'Actif' : company.subscriptionStatus === 'trial' ? 'Essai' : 'Inactif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {isExpired && company.subscriptionStatus === 'active' ? (
                                                <div className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Expiré
                                                </div>
                                            ) : isExpiring ? (
                                                <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                                                    <Clock className="h-3 w-3" />
                                                    Urgent
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-accent text-xs font-semibold">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Sain
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {company.subscriptionStatus === 'active' ? formatCurrency(29.99) : formatCurrency(0)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
