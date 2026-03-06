"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Plus, Trash2, Edit } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import type { PointOfSale } from "@/lib/types";
import { DataService } from "@/lib/data-service";

export default function POSManagementPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [posName, setPosName] = useState("");
    const [posLocation, setPosLocation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { company, profile, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const posQuery = useMemoFirebase(() => {
        if (!company?.id || !firestore) return null;
        return query(collection(firestore, "pointsOfSale"), where("companyId", "==", company.id));
    }, [firestore, company?.id]);

    const { data: pointsOfSale, isLoading: isCollectionLoading } = useCollection<PointOfSale>(posQuery);
    const isLoading = isProfileLoading || isCollectionLoading;

    const handleAddPOS = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company || !posName) return;

        setIsSubmitting(true);
        try {
            await DataService.createPointOfSale({
                companyId: company.id,
                name: posName,
                location: posLocation,
                createdAt: new Date().toISOString()
            });

            toast({
                title: "Point de vente créé",
                description: `Le point de vente "${posName}" a été créé avec succès.`
            });
            setIsAddDialogOpen(false);
            setPosName("");
            setPosLocation("");
        } catch (error) {
            console.error("Error creating POS:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue lors de la création du point de vente."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePOS = async (posId: string, name: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer le point de vente "${name}" ?`)) return;

        try {
            await DataService.deletePointOfSale(posId);
            toast({
                title: "Point de vente supprimé",
                description: `Le point de vente "${name}" a été supprimé.`
            });
        } catch (error) {
            console.error("Error deleting POS:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de supprimer ce point de vente."
            });
        }
    };

    if (profile?.role !== 'owner' && profile?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <Store className="h-10 w-10 text-destructive mb-2" />
                        <CardTitle>Accès Refusé</CardTitle>
                        <CardDescription>
                            Seuls les administrateurs peuvent gérer les points de vente.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Points de Vente</h1>
                    <p className="text-sm text-muted-foreground">Gérez les différents points de vente de votre entreprise.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau Point de Vente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer un Point de Vente</DialogTitle>
                            <DialogDescription>
                                Ajoutez un nouveau magasin, guichet ou registre.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddPOS}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nom du Point de Vente</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Boutique Principale"
                                        value={posName}
                                        onChange={(e) => setPosName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Emplacement / Adresse (optionnel)</Label>
                                    <Input
                                        id="location"
                                        placeholder="Ex: Centre-ville"
                                        value={posLocation}
                                        onChange={(e) => setPosLocation(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Création..." : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Points de Vente</CardTitle>
                    <CardDescription>
                        Consultez et gérez l'ensemble de vos registres de caisse ou magasins.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Emplacement</TableHead>
                                <TableHead>Date de création</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                (pointsOfSale ?? []).map((pos) => (
                                    <TableRow key={pos.id}>
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                <Store className="h-4 w-4 text-muted-foreground" />
                                                {pos.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {pos.location || "Non spécifié"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {pos.createdAt ? new Date(pos.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeletePOS(pos.id, pos.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && pointsOfSale?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Aucun point de vente trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
