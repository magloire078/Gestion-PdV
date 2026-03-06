
"use client";

import { useCollection, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Power, PowerOff, ShieldCheck } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/lib/types";

export default function AdminCompaniesPage() {
    const firestore = useFirestore();
    const companiesRef = useMemoFirebase(() => collection(firestore, "companies"), [firestore]);
    const { data: companies, isLoading } = useCollection<Company>(companiesRef);
    const { toast } = useToast();

    const toggleSubscription = async (company: Company) => {
        if (!firestore) return;

        const newStatus = company.subscriptionStatus === 'active' ? 'inactive' : 'active';
        try {
            const companyRef = doc(firestore, "companies", company.id);
            await updateDocumentNonBlocking(companyRef, {
                subscriptionStatus: newStatus
            });

            const statusLabel = newStatus === 'active' ? 'active' : 'inactive';
            toast({
                title: "Statut mis à jour",
                description: `L'entreprise ${company.name} est maintenant ${statusLabel}.`
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour le statut."
            });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gestion des Entreprises</h1>
                <p className="text-sm text-muted-foreground">Pilotez les comptes clients et leurs abonnements.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Entreprises</CardTitle>
                    <CardDescription>
                        {companies?.length || 0} entreprise(s) enregistrée(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entreprise</TableHead>
                                <TableHead>Propriétaire (ID)</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Fin Abo.</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                companies?.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name}</TableCell>
                                        <TableCell className="text-xs font-mono">{company.ownerId}</TableCell>
                                        <TableCell>
                                            <Badge variant={company.subscriptionStatus === 'active' ? 'default' : company.subscriptionStatus === 'trial' ? 'outline' : 'destructive'}>
                                                {company.subscriptionStatus === 'active' ? 'Actif' : company.subscriptionStatus === 'trial' ? 'Essai' : 'Inactif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {company.subscriptionEndDate
                                                ? new Date(company.subscriptionEndDate).toLocaleDateString('fr-FR')
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => toggleSubscription(company)}>
                                                        {company.subscriptionStatus === 'active' ? (
                                                            <div className="flex items-center text-destructive">
                                                                <PowerOff className="mr-2 h-4 w-4" />
                                                                Suspendre
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-accent">
                                                                <Power className="mr-2 h-4 w-4" />
                                                                Activer
                                                            </div>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard?adminCompanyId=${company.id}`}>
                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                            Voir le Dashboard
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
