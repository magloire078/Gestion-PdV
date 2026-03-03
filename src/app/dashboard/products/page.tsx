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
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase/firestore/use-collection";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
}

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
};

export default function ProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState(EMPTY_FORM);

    const productsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, "products");
    }, [firestore]);

    const { data: products, isLoading } = useCollection<Omit<Product, "id">>(productsRef);

    const filtered = useMemo(() => {
        if (!products) return [];
        const q = search.toLowerCase();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
        );
    }, [products, search]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productsRef) return;
        try {
            await addDoc(productsRef, {
                name: formData.name.trim(),
                price: parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock),
            });
            toast({ title: "Produit ajouté", description: `${formData.name} a été ajouté au catalogue.` });
            setIsAddDialogOpen(false);
            setFormData(EMPTY_FORM);
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le produit." });
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !firestore) return;
        try {
            const ref = doc(firestore, "products", editingProduct.id);
            await updateDoc(ref, {
                name: formData.name.trim(),
                price: parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock),
            });
            toast({ title: "Produit modifié", description: `${formData.name} a été mis à jour.` });
            setEditingProduct(null);
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le produit." });
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct || !firestore) return;
        try {
            await deleteDoc(doc(firestore, "products", deletingProduct.id));
            toast({ title: "Produit supprimé", description: `${deletingProduct.name} a été supprimé.` });
            setDeletingProduct(null);
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le produit." });
        }
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: String(product.price),
            category: product.category,
            stock: String(product.stock),
        });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);

    const ProductForm = ({ onSubmit, title, description, submitLabel }: {
        onSubmit: (e: React.FormEvent) => void;
        title: string;
        description: string;
        submitLabel: string;
    }) => (
        <form onSubmit={onSubmit}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nom</Label>
                    <Input
                        id="name" className="col-span-3" required
                        value={formData.name}
                        onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Prix (FCFA)</Label>
                    <Input
                        id="price" type="number" min="0" step="50" className="col-span-3" required
                        value={formData.price}
                        onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Catégorie</Label>
                    <select
                        id="category"
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.category}
                        onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                    >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stock</Label>
                    <Input
                        id="stock" type="number" min="0" className="col-span-3" required
                        value={formData.stock}
                        onChange={(e) => setFormData((f) => ({ ...f, stock: e.target.value }))}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">{submitLabel}</Button>
            </DialogFooter>
        </form>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Produits POS</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (open) setFormData(EMPTY_FORM); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un produit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <ProductForm
                            onSubmit={handleAdd}
                            title="Nouveau produit"
                            description="Ajoutez un produit au catalogue du POS."
                            submitLabel="Ajouter"
                        />
                    </DialogContent>
                </Dialog>
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
                            {isLoading ? "…" : new Set(products?.map((p) => p.category)).size}
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
                            {isLoading ? "…" : (products?.reduce((s, p) => s + (p.stock || 0), 0) ?? 0)}
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
                {!isLoading && filtered.map((p) => (
                    <Card key={p.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-base">{p.name}</CardTitle>
                                <CardDescription><Badge variant="outline">{p.category}</Badge></CardDescription>
                            </div>
                            <div className="text-right font-bold text-lg">{formatCurrency(p.price)}</div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stock: {p.stock}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openEdit(p)}>Modifier</DropdownMenuItem>
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
                                <TableHead>Nom</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Prix (FCFA)</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && filtered.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={product.stock < 10 ? "text-destructive font-medium" : ""}>{product.stock}</span>
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
                                                <DropdownMenuItem onClick={() => openEdit(product)}>Modifier</DropdownMenuItem>
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
                            <Button onClick={() => { setFormData(EMPTY_FORM); setIsAddDialogOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter un produit
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            {editingProduct && (
                <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <ProductForm
                            onSubmit={handleEdit}
                            title="Modifier le produit"
                            description={`Mettez à jour les détails de "${editingProduct.name}".`}
                            submitLabel="Enregistrer"
                        />
                    </DialogContent>
                </Dialog>
            )}

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
