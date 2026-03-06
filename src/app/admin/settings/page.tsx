
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Bell, Globe, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Paramètres enregistrés",
            description: "Les modifications ont été appliquées avec succès.",
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Configuration Système</h1>
                <p className="text-sm text-muted-foreground">Gérez les paramètres globaux de la plateforme.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Globe className="h-5 w-5" />
                            Général
                        </CardTitle>
                        <CardDescription>Informations de base de l'application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="app-name">Nom de la Plateforme</Label>
                            <Input id="app-name" defaultValue="Gestion PdV Pro" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="support-email">Email de Support</Label>
                            <Input id="support-email" defaultValue="support@gestionpdv.com" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600">
                            <Shield className="h-5 w-5" />
                            Sécurité & Accès
                        </CardTitle>
                        <CardDescription>Contrôlez qui peut s'inscrire et utiliser le service.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label>Inscriptions Publiques</Label>
                                <p className="text-xs text-muted-foreground">Autoriser de nouvelles entreprises à créer un compte.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label>Mode Maintenance</Label>
                                <p className="text-xs text-muted-foreground">Désactiver l'accès pour tous sauf les admins.</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <Bell className="h-5 w-5" />
                            Système de Notifications
                        </CardTitle>
                        <CardDescription>Configuration des alertes globales.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label>Alertes d'Expiration</Label>
                                <p className="text-xs text-muted-foreground">Envoyer des relances automatiques 5 jours avant.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label>Rapports Hebdomadaires</Label>
                                <p className="text-xs text-muted-foreground">Envoyer un résumé des performances le lundi.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-600">
                            <Zap className="h-5 w-5" />
                            Performance
                        </CardTitle>
                        <CardDescription>Optimisations et limites système.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="max-users">Limite Utilisateurs / Entreprise</Label>
                            <Input id="max-users" type="number" defaultValue="50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storage-limit">Quota Stockage (Go)</Label>
                            <Input id="storage-limit" type="number" defaultValue="5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer les Paramètres
                </Button>
            </div>
        </div>
    );
}
