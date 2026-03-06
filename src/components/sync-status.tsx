"use client";

import { useEffect, useState } from "react";
import { CloudOff, CloudUpload, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { useProfile } from "@/hooks/use-profile";

export function SyncStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const { company } = useProfile();

    useEffect(() => {
        if (typeof window === "undefined") return;

        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!company?.id) return;

        const checkPendingItems = async () => {
            try {
                const pendingProducts = await db.products
                    .where('synced').equals(0)
                    .and(p => p.companyId === company.id)
                    .count();
                const pendingSales = await db.sales
                    .where('synced').equals(0)
                    .and(s => s.companyId === company.id)
                    .count();

                setPendingCount(pendingProducts + pendingSales);
            } catch (error) {
                console.error("Failed to check pending sync items", error);
            }
        };

        checkPendingItems();
        const interval = setInterval(checkPendingItems, 2000);

        return () => clearInterval(interval);
    }, [company?.id]);

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-destructive/20" title={`Hors ligne. ${pendingCount} éléments en attente de synchronisation.`}>
                <CloudOff className="h-4 w-4 text-destructive" />
                <span>Hors ligne ({pendingCount > 0 ? `${pendingCount} non sync.` : '0 en attente'})</span>
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-md border border-primary/20" title="Synchronisation vers le cloud en cours...">
                <CloudUpload className="h-4 w-4 animate-pulse" />
                <span>Synchro. en cours ({pendingCount})</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-xs text-emerald-600/70 dark:text-emerald-400/50 bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-md border-transparent" title="Toutes les données sont synchronisées">
            <CheckCircle2 className="h-4 w-4" />
            <span>Serveur à jour</span>
        </div>
    );
}
