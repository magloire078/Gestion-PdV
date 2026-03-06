
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useProfile } from "@/hooks/use-profile";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { StockMovement } from "@/lib/types";

export default function MovementsPage() {
    const { company, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const movementsQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(
            collection(firestore, "stockMovements"),
            where("companyId", "==", company.id),
            orderBy("date", "desc")
        );
    }, [firestore, company?.id]);

    const { data: movements, isLoading: isMovementsLoading } = useCollection<StockMovement>(movementsQuery);

    const isLoading = isProfileLoading || isMovementsLoading;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Historique des Mouvements</h1>
                <p className="text-sm text-muted-foreground">Suivez toutes les entrées et sorties de stock de votre entreprise.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Mouvements de Stock
                    </CardTitle>
                    <CardDescription>
                        Liste chronologique des changements de quantité.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Raison</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    </TableRow>
                                ))
                            ) : movements?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        Aucun mouvement de stock enregistré.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movements?.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-sm">
                                            {new Date(m.date).toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="font-medium">{m.productName}</TableCell>
                                        <TableCell>
                                            {m.type === 'IN' ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    <ArrowDownLeft className="mr-1 h-3 w-3" />
                                                    Entrée
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                                    <ArrowUpRight className="mr-1 h-3 w-3" />
                                                    Sortie
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {m.type === 'IN' ? '+' : '-'}{m.quantity}
                                        </TableCell>
                                        <TableCell>{m.reason}</TableCell>
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
