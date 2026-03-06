"use client";

import { useState, useMemo, useEffect } from "react";
import { CldImage } from 'next-cloudinary';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    PlusCircle,
    Package,
    Search,
} from "lucide-react";
import { useFirebase, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DataService } from "@/lib/data-service";
import { Product, db } from "@/lib/db";
import { useProfile } from "@/hooks/use-profile";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Loader2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

const CATEGORIES = [
    "Boissons",
    "Alimentation",
    "Hygiène",
    "Divers",
    "Électronique",
    "Vêtements",
    "Autre",
];

const EMPTY_FORM = {
    name: "",
    price: "",
    category: "Divers",
    stock: "0",
    minStock: "5",
    barcode: "",
    imageUrl: "",
};

export default function ProductsPage() {
    const { firestore, user, isUserLoading: isAuthLoading } = useFirebase();
    const { company, isLoading: isProfileLoading } = useProfile();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState("");
    //formData removed as it's now local to ProductDialog

    const products = useLiveQuery(
        () => company ? db.products.where('companyId').equals(company.id).toArray() : [],
        [company?.id]
    );

    const isLoading = isAuthLoading || isProfileLoading || products === undefined;

    const filtered = useMemo(() => {
        if (!products) return [];
        const q = search.toLowerCase();
        return products.filter(
            (p: Product) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
        );
    }, [products, search]);

    const handleAdd = async (data: any) => {
        if (!firestore || !user || !company) {
            toast({
                title: "Erreur",
                description: "Vous devez être connecté à une entreprise pour ajouter un produit.",
                variant: "destructive",
            });
            return;
        }

        console.log("Adding product with data:", {
            name: data.name,
            companyId: company.id,
            price: data.price,
            stock: data.stock,
            userId: user.uid
        });

        try {
            const productData = {
                name: data.name.trim(),
                companyId: company.id,
                price: parseFloat(data.price) || 0,
                category: data.category,
                stock: parseInt(data.stock) || 0,
                minStock: parseInt(data.minStock) || 0,
                barcode: (data.barcode || "").trim(),
                imageUrl: (data.imageUrl || "").trim(),
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
            };

            console.log("Saving product locally first via DataService...");
            const localId = await DataService.saveProduct(productData);
            console.log("Product saved locally with temp ID:", localId);

            setIsAddDialogOpen(false);
            toast({
                title: "Produit ajouté",
                description: "Le produit a été enregistré. Il sera synchronisé avec le serveur en arrière-plan.",
            });
        } catch (error: any) {
            console.error("Detailed error adding product:", error);
            toast({
                title: "Erreur lors de l'ajout",
                description: "Impossible d'ajouter le produit. Vérifiez votre connexion et les logs console.",
                variant: "destructive",
            });
        }
    };

    const handleEdit = async (data: any) => {
        if (!editingProduct || !user) return;

        try {
            const productData = {
                name: data.name.trim(),
                price: parseFloat(data.price) || 0,
                category: data.category,
                stock: parseInt(data.stock) || 0,
                minStock: parseInt(data.minStock) || 0,
                barcode: (data.barcode || "").trim(),
                imageUrl: (data.imageUrl || "").trim(),
                updatedAt: new Date().toISOString(),
            };

            console.log("Updating product locally first...");
            await DataService.updateProduct(editingProduct.id, productData);

            setEditingProduct(null);
            toast({
                title: "Produit mis à jour",
                description: "Les modifications ont été enregistrées localement et seront synchronisées.",
            });
        } catch (error: any) {
            console.error("Error updating product:", error);
            toast({
                title: "Erreur de mise à jour",
                description: "Impossible de modifier le produit localement.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;

        console.log("Deleting product locally first...");

        try {
            await DataService.deleteProduct(deletingProduct.id);
            toast({
                title: "Produit supprimé",
                description: `${deletingProduct.name} a été retiré de la base locale.`
            });
            setDeletingProduct(null);
        } catch (error: any) {
            console.error('Erreur suppression produit:', error);
            toast({
                variant: "destructive",
                title: "Erreur de suppression",
                description: "Impossible de supprimer le produit."
            });
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);
    return (
        <div className="flex flex-col gap-6">
            {/* Not logged in warning */}
            {!isLoading && !user && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    ⚠️ Vous devez être connecté pour gérer les produits.
                </div>
            )}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Catalogue Produits</h1>
                <ProductDialog
                    mode="add"
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onSubmit={handleAdd}
                />
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "…" : (products?.length ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">dans le catalogue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Catégories</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "…" : new Set(products?.map((p: Product) => p.category)).size}
                        </div>
                        <p className="text-xs text-muted-foreground">catégories actives</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Stock total</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "…" : (products?.reduce((s: number, p: Product) => s + (p.stock || 0), 0) ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">unités en stock</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Rechercher un produit ou une catégorie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Mobile view */}
            <div className="grid gap-4 md:hidden">
                {isLoading && [...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/5" /></CardHeader>
                        <CardContent><div className="space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div></CardContent>
                    </Card>
                ))}
                {!isLoading && filtered.map((p: Product) => (
                    <Card key={p.id}>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            {p.imageUrl ? (
                                <CldImage src={p.imageUrl} alt={p.name} width={48} height={48} preserveTransformations className="h-12 w-12 object-cover rounded-md border" />
                            ) : (
                                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1">
                                <CardTitle className="text-base">{p.name}</CardTitle>
                                <CardDescription className="flex justify-between items-center">
                                    <Badge variant="outline">{p.category}</Badge>
                                    <span className="font-bold text-lg">{formatCurrency(p.price)}</span>
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stock: {p.stock}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setEditingProduct(p)}>Modifier</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingProduct(p)}>Supprimer</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardContent>
                    </Card>
                ))}
                {!isLoading && filtered.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Aucun produit</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Ajoutez votre premier produit au catalogue POS.</p>
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg">
                {isLoading || (filtered.length > 0) ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Code-barres</TableHead>
                                <TableHead className="text-right">Prix (FCFA)</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && filtered.map((product: Product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.imageUrl ? (
                                            <CldImage src={product.imageUrl} alt={product.name} width={40} height={40} preserveTransformations className="h-10 w-10 object-cover rounded-md border" />
                                        ) : (
                                            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>{product.name}</div>
                                        <div className="text-xs text-muted-foreground md:hidden">{product.barcode}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                                    <TableCell className="text-xs font-mono">{product.barcode || "-"}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={product.stock < (product.minStock || 5) ? "text-destructive font-bold" : ""}>{product.stock}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingProduct(product)}>Modifier</DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeletingProduct(product)}
                                                >
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Aucun produit</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Ajoutez votre premier produit au catalogue POS.</p>
                        <div className="mt-6">
                            <Button onClick={() => { setIsAddDialogOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter un produit
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <ProductDialog
                mode="edit"
                product={editingProduct}
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                onSubmit={handleEdit}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingProduct} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. <strong>{deletingProduct?.name}</strong> sera définitivement supprimé du catalogue POS.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ProductDialog({ mode, product, open, onOpenChange, onSubmit }: {
    mode: "add" | "edit";
    product?: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
}) {
    const [localData, setLocalData] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            if (mode === "edit" && product) {
                setLocalData({
                    name: product.name,
                    price: String(product.price),
                    category: product.category,
                    stock: String(product.stock),
                    minStock: String(product.minStock || 5),
                    barcode: product.barcode || "",
                    imageUrl: product.imageUrl || "",
                });
            } else {
                setLocalData(EMPTY_FORM);
            }
        }
    }, [open, mode, product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(localData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            const url = await uploadToCloudinary(file, "products");
            if (url) {
                setLocalData(prev => ({ ...prev, imageUrl: url }));
                toast({ title: "Image chargée", description: "L'image du produit a été mise à jour sur Cloudinary." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement de l'image." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = mode === "add" ? "Nouveau produit" : "Modifier le produit";
    const description = mode === "add"
        ? "Ajoutez un produit au catalogue du POS."
        : `Mettez à jour les détails de "${product?.name}".`;
    const submitLabel = isSubmitting ? "En cours..." : (mode === "add" ? "Ajouter" : "Enregistrer");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {mode === "add" && (
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un produit
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nom</Label>
                            <Input
                                id="name" className="col-span-3" required
                                value={localData.name}
                                onChange={(e) => setLocalData(d => ({ ...d, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Prix (FCFA)</Label>
                            <Input
                                id="price" type="number" min="0" step="50" className="col-span-3" required
                                value={localData.price}
                                onChange={(e) => setLocalData(d => ({ ...d, price: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Catégorie</Label>
                            <select
                                id="category"
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={localData.category}
                                onChange={(e) => setLocalData(d => ({ ...d, category: e.target.value }))}
                            >
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">Stock</Label>
                            <Input
                                id="stock" type="number" min="0" className="col-span-3" required
                                value={localData.stock}
                                onChange={(e) => setLocalData(d => ({ ...d, stock: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="minStock" className="text-right">Seuil d'alerte</Label>
                            <Input
                                id="minStock" type="number" min="0" className="col-span-3" required
                                value={localData.minStock}
                                onChange={(e) => setLocalData(d => ({ ...d, minStock: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="barcode" className="text-right">Code-barres</Label>
                            <Input
                                id="barcode" className="col-span-3"
                                placeholder="Scanner ou saisir..."
                                value={localData.barcode}
                                onChange={(e) => setLocalData(d => ({ ...d, barcode: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">Image (Fichier)</Label>
                            <div className="col-span-3">
                                <Input
                                    id="image" type="file" accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="imageUrl" className="text-right">Image (URL)</Label>
                            <Input
                                id="imageUrl" className="col-span-3"
                                placeholder="https://..."
                                value={localData.imageUrl}
                                onChange={(e) => setLocalData(d => ({ ...d, imageUrl: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Aperçu</Label>
                            <div className="col-span-3 flex justify-center p-2 border rounded-md bg-muted/30 min-h-[120px] items-center">
                                {localData.imageUrl ? (
                                    <div className="relative group w-full flex justify-center">
                                        <CldImage
                                            src={localData.imageUrl}
                                            alt="Preview"
                                            width={800}
                                            height={800}
                                            preserveTransformations
                                            className="max-h-[150px] w-auto object-contain rounded-md shadow-sm transition-transform group-hover:scale-105"
                                        />
                                        {isSubmitting && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <PlusCircle className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <span className="text-xs italic">Aucune image sélectionnée</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>{submitLabel}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
