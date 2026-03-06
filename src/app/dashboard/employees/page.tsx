
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, UserMinus, Shield, ShieldCheck, Mail } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where, getDocs, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import type { UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function EmployeesPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"employee" | "owner">("employee");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { company, profile, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const employeesQuery = useMemoFirebase(() => {
        if (!company?.id || !firestore) return null;
        return query(collection(firestore, "users"), where("companyId", "==", company.id));
    }, [firestore, company?.id]);

    const { data: employees, isLoading: isCollectionLoading } = useCollection<UserProfile>(employeesQuery);
    const isLoading = isProfileLoading || isCollectionLoading;

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company || !firestore || !email) return;

        setIsSubmitting(true);
        try {
            // 1. Find user by email
            const usersRef = collection(firestore, "users");
            const q = query(usersRef, where("email", "==", email), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "Utilisateur non trouvé",
                    description: "Aucun utilisateur n'est inscrit avec cette adresse email."
                });
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as UserProfile;

            if (userData.companyId) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Cet utilisateur appartient déjà à une entreprise."
                });
                return;
            }

            // 2. Update user profile
            const userRef = doc(firestore, "users", userDoc.id);
            await updateDocumentNonBlocking(userRef, {
                companyId: company.id,
                role: role
            });

            toast({
                title: "Employé ajouté",
                description: `${email} a été ajouté à votre équipe.`
            });
            setIsAddDialogOpen(false);
            setEmail("");
        } catch (error) {
            console.error("Error adding employee:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue lors de l'ajout de l'employé."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveEmployee = async (employeeId: string, employeeEmail: string) => {
        if (!firestore || employeeId === profile?.id) return;

        try {
            const userRef = doc(firestore, "users", employeeId);
            await updateDocumentNonBlocking(userRef, {
                companyId: null,
                role: 'employee' // Reset to default
            });

            toast({
                title: "Employé retiré",
                description: `${employeeEmail} a été retiré de votre équipe.`
            });
        } catch (error) {
            console.error("Error removing employee:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de retirer l'employé."
            });
        }
    };

    if (profile?.role !== 'owner' && profile?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <Shield className="h-10 w-10 text-destructive mb-2" />
                        <CardTitle>Accès Refusé</CardTitle>
                        <CardDescription>
                            Seuls les propriétaires de l'entreprise peuvent gérer les employés.
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
                    <h1 className="text-2xl font-semibold">Gestion des Employés</h1>
                    <p className="text-sm text-muted-foreground">Gérez les membres de votre équipe et leurs permissions.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Ajouter un membre
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Inviter un membre</DialogTitle>
                            <DialogDescription>
                                L'utilisateur doit déjà avoir un compte sur la plateforme.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddEmployee}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email de l'utilisateur</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="exemple@mail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Rôle</Label>
                                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employé</SelectItem>
                                            <SelectItem value="owner">Co-propriétaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Ajout..." : "Ajouter"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Membres de l'équipe</CardTitle>
                    <CardDescription>
                        Liste des utilisateurs ayant accès à votre entreprise.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Date d'ajout</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                (employees ?? []).map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{emp.displayName || "Sans nom"}</span>
                                                <span className="text-xs text-muted-foreground">{emp.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.role === 'owner' ? 'default' : 'secondary'}>
                                                {emp.role === 'owner' ? (
                                                    <div className="flex items-center gap-1">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Propriétaire
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        Employé
                                                    </div>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {emp.id !== profile?.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveEmployee(emp.id, emp.email)}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && employees?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Aucun employé trouvé.
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
