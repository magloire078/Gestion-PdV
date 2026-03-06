
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Company, UserProfile } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Building2,
    Users,
    CreditCard,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const companiesRef = useMemoFirebase(() => collection(firestore, "companies"), [firestore]);
    const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);

    const { data: companies = [], isLoading: loadingCompanies } = useCollection<Company>(companiesRef);
    const { data: users = [], isLoading: loadingUsers } = useCollection<UserProfile>(usersRef);

    const safeCompanies = companies || [];
    const safeUsers = users || [];

    const stats = {
        totalCompanies: safeCompanies.length,
        totalUsers: safeUsers.length,
        activeSubscriptions: safeCompanies.filter(c => c.subscriptionStatus === 'active').length,
        totalRevenue: safeCompanies.filter(c => c.subscriptionStatus === 'active').length * 29.99, // Estimation de base
    };

    const isLoading = loadingCompanies || loadingUsers;

    const recentCompanies = [...safeCompanies]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const cards = [
        {
            title: "Entreprises",
            value: stats.totalCompanies.toString(),
            description: "Inscrites sur la plateforme",
            icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Utilisateurs",
            value: stats.totalUsers.toString(),
            description: "Comptes créés au total",
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Abonnements Actifs",
            value: stats.activeSubscriptions.toString(),
            description: `${Math.round((stats.activeSubscriptions / stats.totalCompanies) * 100) || 0}% de conversion`,
            icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Chiffre d'Affaire Mensuel",
            value: formatCurrency(stats.totalRevenue),
            description: "Estimation (MRR)",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Tableau de Bord Système</h1>
                <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme SaaS.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    cards.map((card) => (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                {card.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">{card.description}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activités Récentes</CardTitle>
                        <CardDescription>Dernières entreprises inscrites.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentCompanies.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucune entreprise inscrite.</p>
                            ) : (
                                recentCompanies.map((c) => (
                                    <div key={c.id} className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Inscrit le {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                        <Badge variant={c.subscriptionStatus === 'active' ? "outline" : c.subscriptionStatus === 'trial' ? "outline" : "secondary"}>
                                            {c.subscriptionStatus === 'active' ? "Abonnement Actif" : c.subscriptionStatus === 'trial' ? "Essai Gratuit" : "Inactif"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>État du Système</CardTitle>
                        <CardDescription>Santé des services.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Firestore</span>
                            <div className="flex items-center gap-1 text-accent">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Opérationnel</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Authentification</span>
                            <div className="flex items-center gap-1 text-accent">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Opérationnel</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Stockage d'images</span>
                            <div className="flex items-center gap-1 text-accent">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Opérationnel</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
