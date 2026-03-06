"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, UserX, UserCheck, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, UserRole } from "@/lib/types";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const firestore = useFirestore();
    const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
    const { data: users, isLoading } = useCollection<UserProfile>(usersRef);

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            await updateDoc(doc(firestore, "users", userId), {
                role: newRole
            });
            toast.success("Rôle mis à jour avec succès");
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Erreur lors de la mise à jour du rôle");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;
        try {
            await deleteDoc(doc(firestore, "users", userId));
            toast.success("Utilisateur supprimé");
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Erreur lors de la suppression");
        }
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'superadmin':
                return <Badge variant="destructive">Super Admin</Badge>;
            case 'owner':
                return <Badge variant="default">Propriétaire</Badge>;
            default:
                return <Badge variant="secondary">Employé</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gestion des Utilisateurs</h1>
                <p className="text-sm text-muted-foreground">Administrez tous les comptes utilisateurs de la plateforme.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tous les Utilisateurs</CardTitle>
                    <CardDescription>
                        Liste complète des utilisateurs inscrits et leurs rôles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Entreprise (ID)</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : users?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Aucun utilisateur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users?.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.displayName || "Sans nom"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {user.companyId || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell>
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Ouvrir le menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'superadmin')}>
                                                        <Shield className="mr-2 h-4 w-4 text-destructive" />
                                                        Promouvoir Super Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'owner')}>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Attribuer Rôle Propriétaire
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'employee')}>
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Passer en Employé
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Supprimer le compte
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
