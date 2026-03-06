"use client"

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { useProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import type { Invoice, Expense, Product, Sale, PointOfSale, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import Link from "next/link";
import { fr } from "date-fns/locale";
import { format } from "date-fns";

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { profile, company, isLoading: isProfileLoading } = useProfile();
  const [selectedPosId, setSelectedPosId] = useState<string>("all");
  const [selectedCashierId, setSelectedCashierId] = useState<string>("all");

  const invoicesQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "invoices"), where("companyId", "==", company.id), orderBy("issueDate", "desc"), limit(5));
  }, [firestore, company?.id]);

  const allInvoicesQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "invoices"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const expensesQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "expenses"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const productsQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "products"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const salesQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "sales"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const posQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "pointsOfSale"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const usersQuery = useMemoFirebase(() => {
    if (!company?.id || !firestore) return null;
    return query(collection(firestore, "users"), where("companyId", "==", company.id));
  }, [firestore, company?.id]);

  const { data: allInvoices, isLoading: isLoadingAllInvoices } = useCollection<Invoice>(allInvoicesQuery);
  const { data: recentInvoices, isLoading: isLoadingRecentInvoices } = useCollection<Invoice>(invoicesQuery);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
  const { data: posList, isLoading: isLoadingPos } = useCollection<PointOfSale>(posQuery);
  const { data: usersList, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isProfileLoading || isLoadingAllInvoices || isLoadingRecentInvoices || isLoadingExpenses || isLoadingProducts || isLoadingSales || isLoadingPos || isLoadingUsers;

  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.stock <= (p.minStock || 5));
  }, [products]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(s => {
      // If user is a cashier, force filter by their assigned POS and ID
      if (profile?.role === 'employee') {
        if (s.posId !== profile.assignedPosId) return false;
        if (s.cashierId !== profile.id) return false;
      } else {
        if (selectedPosId !== 'all' && s.posId !== selectedPosId) return false;
        if (selectedCashierId !== 'all' && s.cashierId !== selectedCashierId) return false;
      }
      return true;
    });
  }, [sales, selectedPosId, selectedCashierId, profile]);

  const totalRevenue = useMemo(() => {
    const invoiceRevenue = allInvoices
      ?.filter((invoice) => invoice.status === "Payée")
      .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;
    const posRevenue = filteredSales?.reduce((sum, sale) => sum + sale.total, 0) ?? 0;
    return invoiceRevenue + posRevenue;
  }, [allInvoices, filteredSales]);

  const totalExpenses = useMemo(() =>
    expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0
    , [expenses]);

  const netProfit = totalRevenue - totalExpenses;

  const kpiData = [
    {
      title: "Revenu Total",
      amount: formatCurrency(totalRevenue),
      description: "Basé sur les factures payées",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      changeIcon: <ArrowUpRight className="h-4 w-4 text-accent" />,
    },
    {
      title: "Dépenses Totales",
      amount: formatCurrency(totalExpenses),
      description: "Toutes les dépenses enregistrées",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      changeIcon: <ArrowDownRight className="h-4 w-4 text-destructive" />,
    },
    {
      title: "Bénéfice Net",
      amount: formatCurrency(netProfit),
      description: "Revenus moins dépenses",
      icon: <Scale className="h-4 w-4 text-muted-foreground" />,
      changeIcon:
        netProfit > 0 ? (
          <ArrowUpRight className="h-4 w-4 text-accent" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-destructive" />
        ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        {(profile?.role === 'owner' || profile?.role === 'superadmin') && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="pos-filter" className="whitespace-nowrap">Point de Vente:</Label>
              <Select value={selectedPosId} onValueChange={setSelectedPosId}>
                <SelectTrigger id="pos-filter" className="w-[180px]">
                  <SelectValue placeholder="Tous les PdV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les PdV</SelectItem>
                  {posList?.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cashier-filter" className="whitespace-nowrap">Caissier:</Label>
              <Select value={selectedCashierId} onValueChange={setSelectedCashierId}>
                <SelectTrigger id="cashier-filter" className="w-[180px]">
                  <SelectValue placeholder="Tous les caissiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les caissiers</SelectItem>
                  {usersList?.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.displayName ?? user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.amount}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
          <CardDescription>
            Revenus et dépenses des 6 derniers mois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart invoices={allInvoices ?? []} expenses={expenses ?? []} sales={filteredSales ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="grid gap-1">
              <CardTitle>Ventes Récentes</CardTitle>
              <CardDescription>Vous avez réalisé {allInvoices?.length ?? 0} ventes ce mois-ci.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/invoices">Tout voir</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentInvoices?.map((invoice) => (
                <div key={invoice.id} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                    <ShoppingCart className="h-4 w-4 text-accent" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{invoice.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invoice.issueDate), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">+{formatCurrency(invoice.amount)}</div>
                </div>
              ))}
              {(!recentInvoices || recentInvoices.length === 0) && (
                <p className="text-sm text-center text-muted-foreground py-4">Aucune vente récente.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Alertes Stock Bas</CardTitle>
            </div>
            <CardDescription>Produits nécessitant un réapprovisionnement.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between group">
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium leading-none capitalize">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Seuil: {product.minStock || 5}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-destructive">{product.stock}</span>
                    <Badge variant="destructive" className="h-5 py-0 px-1 text-[10px]">Critique</Badge>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                    <Scale className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm font-medium">Stock équilibré</p>
                  <p className="text-xs text-muted-foreground">Tous vos produits sont au-dessus des seuils.</p>
                </div>
              )}
              {lowStockProducts.length > 6 && (
                <Button asChild variant="link" className="w-full text-xs text-muted-foreground p-0 h-auto">
                  <Link href="/dashboard/products">Voir les {lowStockProducts.length - 6} autres...</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
