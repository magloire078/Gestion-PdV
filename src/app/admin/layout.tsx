
"use client";

import { useProfile } from "@/hooks/use-profile";
import {
    BarChart3,
    Building2,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Users,
    ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser, useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const adminNavItems = [
    {
        title: "Vue d'ensemble",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Entreprises",
        href: "/admin/companies",
        icon: Building2,
    },
    {
        title: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Abonnements",
        href: "/admin/subscriptions",
        icon: CreditCard,
    },
    {
        title: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
    },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, isLoading } = useProfile();
    const auth = useFirebase()?.auth;

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        );
    }

    if (profile?.role !== 'superadmin') {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-3xl font-bold tracking-tight">Accès Restreint</h1>
                <p className="mt-2 text-muted-foreground">
                    Vous n'avez pas les permissions nécessaires pour accéder à l'interface d'administration système.
                </p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/dashboard">Retour au Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                                <nav className="flex flex-col gap-4 py-4">
                                    <div className="px-3 py-2">
                                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                                            Admin Système
                                        </h2>
                                        <div className="space-y-1">
                                            {adminNavItems.map((item) => (
                                                <Button
                                                    key={item.href}
                                                    variant={pathname === item.href ? "secondary" : "ghost"}
                                                    className="w-full justify-start"
                                                    asChild
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                        {item.title}
                                                    </Link>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                        <Link href="/admin" className="flex items-center gap-2">
                            <ShieldAlert className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight">SuperAdmin</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-muted-foreground md:inline-block">
                            {profile.email}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleSignOut}>
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Déconnexion</span>
                        </Button>
                    </div>
                </div>
            </header>
            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 py-6">
                <aside className="fixed top-20 z-30 -ml-2 hidden h-[calc(100vh-5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
                    <nav className="flex flex-col gap-2 p-4">
                        {adminNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                        <div className="mt-auto pt-4 border-t">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Tableau de bord Client
                            </Link>
                        </div>
                    </nav>
                </aside>
                <main className="flex w-full flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        }>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}
