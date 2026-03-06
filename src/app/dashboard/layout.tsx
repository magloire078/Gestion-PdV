
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DollarSign,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Warehouse,
  History,
  Store,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { SyncStatus } from "@/components/sync-status";
import { useState, useEffect } from "react";
import { useAuth, useUser, useFirebase, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import type { Company } from "@/lib/types";
import { Suspense } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de Bord" },
  { href: "/pos", icon: ShoppingCart, label: "Point de Vente (POS)" },
  { href: "/dashboard/products", icon: Package, label: "Produits" },
  { href: "/dashboard/stocks", icon: Warehouse, label: "Gestion des Stocks" },
  { href: "/dashboard/movements", icon: History, label: "Mouvements" },
  { href: "/dashboard/employees", icon: Users, label: "Employés", roles: ['owner', 'superadmin'] },
  { href: "/dashboard/pos-management", icon: Store, label: "Points de Vente", roles: ['owner', 'superadmin'] },
  { href: "/dashboard/reports", icon: LineChart, label: "Rapports & Stats", roles: ['owner', 'superadmin'] },
  { href: "/admin", icon: Settings, label: "Admin Système", roles: ['superadmin'] },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

function UserNav() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.photoURL ?? undefined}
              alt="Avatar"
            />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.displayName ?? user?.email ?? 'Mon Compte'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Clair
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Sombre
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({ logoUrl, role }: { logoUrl?: string | null, role?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
            onClick={() => setIsOpen(false)}
          >
            <Logo logoUrl={logoUrl} />
          </Link>
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href
                ? "text-primary bg-muted"
                : "text-muted-foreground hover:text-primary"
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { profile, company, isLoading: isProfileLoading, error: profileError } = useProfile();

  const isUserLoading = isAuthLoading || isProfileLoading;

  // Auto-create/fix profile and company logic
  useEffect(() => {
    if (!user || !firestore || isUserLoading) return;

    // Only if we are sure profile and company are missing after loading, and there's no auth/permission error
    if (!profile && !isProfileLoading && !profileError) {
      console.log("Creating default profile and company for user:", user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      const role = user.email === 'magloire078@gmail.com' ? 'superadmin' : 'owner';
      setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        role: role,
        companyId: user.uid,
        createdAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Error creating default profile:", err));

      const companyRef = doc(firestore, 'companies', user.uid);
      setDoc(companyRef, {
        name: user.displayName ?? user.email ?? 'Mon Entreprise',
        ownerId: user.uid,
        email: user.email ?? '',
        creationDate: new Date().toISOString(),
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { merge: true }).catch(err => console.error("Error creating default company:", err));
    }
  }, [user, firestore, profile, isUserLoading, isProfileLoading]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  );

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-auto flex-col items-center border-b px-4 py-6 lg:h-auto lg:px-6">
            <Link href="/dashboard" className="flex flex-col items-center gap-2 font-semibold">
              <Logo logoUrl={company?.logoUrl} name={company?.name} />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:text-primary"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 mt-auto">
            <SyncStatus />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <MobileNav logoUrl={company?.logoUrl} role={profile?.role} />
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader">Chargement...</div>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
