"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History, ArrowUpCircle, ArrowDownCircle, Plus } from "lucide-react";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, addDoc, doc, updateDoc, increment, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { StockMovement, Product } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useProfile } from "@/hooks/use-profile";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function StocksPage() {
    const { firestore, user, isUserLoading: isAuthLoading } = useFirebase();
    const { company, isLoading: isProfileLoading } = useProfile();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedProductId, setSelectedProductId] = useState("");
    const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("Réapprovisionnement");

    const movementsQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(
            collection(firestore, "stockMovements"),
            where("companyId", "==", company.id),
            orderBy("date", "desc"),
            limit(100)
        );
    }, [firestore, company?.id]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(collection(firestore, "products"), where("companyId", "==", company.id));
    }, [firestore, company?.id]);

    const { data: movements, isLoading: isMovementsLoading } = useCollection<StockMovement>(movementsQuery);
    const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

    const isLoading = isAuthLoading || isProfileLoading || isMovementsLoading;

    const filtered = useMemo(() => {
        if (!movements) return [];
        return movements.filter(m =>
            m.productName.toLowerCase().includes(search.toLowerCase()) ||
            m.reason.toLowerCase().includes(search.toLowerCase())
        );
    }, [movements, search]);

    const handleAddMovement = async () => {
        if (!firestore || !user || !company || !selectedProductId) return;
        setIsSubmitting(true);

        try {
            const product = products?.find(p => p.id === selectedProductId);
            if (!product) throw new Error("Produit non trouvé");

            const qtyNum = parseInt(quantity);
            if (isNaN(qtyNum) || qtyNum <= 0) throw new Error("Quantité invalide");

            // 1. Create movement record
            await addDoc(collection(firestore, "stockMovements"), {
                companyId: company.id,
                productId: selectedProductId,
                productName: product.name,
                type: movementType,
                quantity: qtyNum,
                reason: reason,
                date: new Date().toISOString()
            });

            // 2. Update product stock
            const productDocRef = doc(firestore, "products", selectedProductId);
            await updateDoc(productDocRef, {
                stock: increment(movementType === "IN" ? qtyNum : -qtyNum),
                updatedAt: new Date().toISOString()
            });

            toast({
                title: "Succès",
                description: "Mouvement enregistré avec succès",
            });
            setIsDialogOpen(false);
            // Reset form
            setSelectedProductId("");
            setQuantity("1");
            setReason("Réapprovisionnement");
        } catch (error: any) {
            console.error("Error adding stock movement:", error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'enregistrer le mouvement",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">Gestion des Stocks</h1>
                    <p className="text-sm text-muted-foreground">Historique des mouvements et audit d'inventaire.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Ajustement Manuel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajuster le Stock</DialogTitle>
                                <DialogDescription>
                                    Enregistrez une entrée ou sortie manuelle de marchandise.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="product">Produit</Label>
                                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un produit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products?.map(p => (
                                                <SelectItem key={p.id} value={p.id!}>
                                                    {p.name} {p.barcode ? `(${p.barcode})` : ""} — {p.stock} en stock
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IN">Entrée (+)</SelectItem>
                                                <SelectItem value="OUT">Sortie (-)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantity">Quantité</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reason">Motif / Raison</Label>
                                    <Select value={reason} onValueChange={setReason}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Réapprovisionnement">Réapprovisionnement</SelectItem>
                                            <SelectItem value="Retour Client">Retour Client</SelectItem>
                                            <SelectItem value="Don / Échantillon">Don / Échantillon</SelectItem>
                                            <SelectItem value="Perte / Casse">Perte / Casse</SelectItem>
                                            <SelectItem value="Correction Erreur">Correction Erreur</SelectItem>
                                            <SelectItem value="Ajustement Inventaire">Ajustement Inventaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleAddMovement}
                                    disabled={isSubmitting || !selectedProductId}
                                >
                                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un produit ou motif..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-accent" />
                        <CardTitle>Mouvements Récents</CardTitle>
                    </div>
                    <CardDescription>
                        Tracé complet de toutes les entrées et sorties de marchandises.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Produit</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Quantité</TableHead>
                                    <TableHead>Motif</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Chargement de l'historique...
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Aucun mouvement trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((movement) => (
                                        <TableRow key={movement.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                {format(new Date(movement.date), "dd MMM yyyy, HH:mm", { locale: fr })}
                                            </TableCell>
                                            <TableCell>{movement.productName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {movement.type === "IN" ? (
                                                        <>
                                                            <ArrowUpCircle className="h-4 w-4 text-accent" />
                                                            <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5">
                                                                Entrée
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowDownCircle className="h-4 w-4 text-destructive" />
                                                            <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">
                                                                Sortie
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${movement.type === 'IN' ? 'text-accent' : 'text-destructive'}`}>
                                                {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {movement.reason}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
