"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePOSStore } from '@/hooks/use-pos-store';
import { useProfile } from '@/hooks/use-profile';
import { DataService } from '@/lib/data-service';
import { SyncEngine } from '@/lib/sync-engine';
import { Product, db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import {
    ShoppingCart,
    Search,
    Package,
    CreditCard,
    Wifi,
    WifiOff,
    Trash2,
    Plus,
    Minus,
    LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

import { Logo } from '@/components/logo';

function POSPageContent() {
    const { company, isLoading: isProfileLoading } = useProfile();
    const products = useLiveQuery(() =>
        company ? db.products.where('companyId').equals(company.id).toArray() : [],
        [company?.id]
    ) || [];

    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const { cart, addItem, removeItem, updateQuantity, total, clearCart } = usePOSStore();

    useEffect(() => {
        if (isProfileLoading || !company) return;

        // Start Sync Engine
        SyncEngine.start(company.id);

        // Online/Offline tracking
        setIsOnline(navigator.onLine);
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, [company, isProfileLoading]);

    // Barcode Scanning Logic
    useEffect(() => {
        let scannerBuffer = "";
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // If user is typing in an input, don't trigger scanner logic
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            const currentTime = Date.now();

            // Scanners usually send keys very fast (under 30ms-50ms)
            if (currentTime - lastKeyTime > 100) {
                scannerBuffer = "";
            }

            if (e.key === 'Enter') {
                if (scannerBuffer.length > 2) {
                    const found = products.find(p => p.barcode === scannerBuffer);
                    if (found) {
                        addItem(found);
                        // Optional: play a sound or show a small toast
                    }
                    scannerBuffer = "";
                }
            } else if (e.key.length === 1) {
                scannerBuffer += e.key;
            }

            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products, addItem]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    const handleCheckout = async () => {
        if (cart.length === 0 || !company) return;

        const sale = {
            companyId: company.id,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total,
            timestamp: Date.now()
        };

        try {
            await DataService.saveSale(sale);
            clearCart();
            toast({
                title: 'Succès',
                description: 'Vente enregistrée avec succès !',
                variant: 'default'
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'enregistrement de la vente.',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-20 border-r border-neutral-800 flex flex-col items-center py-6 gap-8 bg-neutral-900/50 backdrop-blur-xl">
                <Link href="/dashboard" title="Retour au Tableau de Bord" className="hover:opacity-80 transition-opacity">
                    <Logo logoUrl={company?.logoUrl} name={company?.name} compact />
                </Link>
                <nav className="flex flex-col gap-6">
                    <Button variant="ghost" className="w-12 h-12 rounded-xl p-0 hover:bg-neutral-800">
                        <Package size={24} className="text-neutral-400" />
                    </Button>
                    <Button variant="ghost" className="w-12 h-12 rounded-xl p-0 hover:bg-neutral-800">
                        <ShoppingCart size={24} className="text-neutral-400" />
                    </Button>
                </nav>
                <div className="mt-auto flex flex-col items-center gap-2">
                    <motion.div
                        animate={isOnline ? { opacity: [0.5, 1, 0.5] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        {isOnline ? (
                            <Wifi size={20} className="text-emerald-500" />
                        ) : (
                            <WifiOff size={20} className="text-rose-500" />
                        )}
                    </motion.div>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-none">
                        {isOnline ? 'En ligne' : 'Hors ligne'}
                    </span>
                </div>
            </aside>

            {/* Main Content: Product Catalog */}
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex justify-between items-center mb-8">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                    >
                        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent uppercase">
                            POINT DE VENTE (PdV)
                        </h1>
                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em]">Expérience de vente nouvelle génération</p>
                    </motion.div>
                    <div className="relative w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <Input
                            placeholder="Rechercher par nom ou catégorie..."
                            className="pl-12 bg-neutral-900/50 border-neutral-800 h-12 focus:ring-2 focus:ring-indigo-500/30 rounded-2xl transition-all placeholder:text-neutral-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                <section className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => addItem(product)}
                                >
                                    <Card className="bg-neutral-900 border-neutral-800 overflow-hidden cursor-pointer group hover:border-indigo-500/50 transition-colors">
                                        <div className="aspect-square relative bg-neutral-800">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="text-neutral-700" size={48} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                <span className="text-xs font-medium text-white bg-indigo-600 px-2 py-1 rounded-lg">Ajouter au panier</span>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <p className="text-sm font-medium text-neutral-300 mb-1">{product.category}</p>
                                            <h3 className="font-semibold text-lg leading-tight mb-2 truncate">{product.name}</h3>
                                            <p className="text-indigo-400 font-bold text-xl">{product.price.toLocaleString()} FCFA</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            </main>

            {/* Right Sidebar: Cart */}
            <aside className="w-96 border-l border-neutral-800 bg-neutral-900/40 backdrop-blur-2xl flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Panier <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-400 font-normal">{cart.length}</span>
                    </h2>
                    <Button variant="ghost" size="icon" onClick={clearCart} className="text-neutral-500 hover:text-rose-500">
                        <Trash2 size={20} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {cart.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="flex items-center gap-4 bg-neutral-800/50 p-3 rounded-xl border border-neutral-800"
                            >
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                    <p className="text-indigo-400 font-bold text-sm">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                </div>
                                <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md p-0"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Minus size={14} />
                                    </Button>
                                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md p-0 text-indigo-400"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus size={14} />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 gap-4 opacity-50">
                            <ShoppingCart size={64} />
                            <p>Le panier est vide</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-4 pt-6 border-t border-neutral-800">
                    <div className="flex justify-between text-neutral-400">
                        <span>Sous-total</span>
                        <span>{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                        <span>TVA (0%)</span>
                        <span>0 FCFA</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2">
                        <span>Total</span>
                        <span className="text-indigo-500">{total.toLocaleString()} FCFA</span>
                    </div>
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-600/20 gap-2"
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                    >
                        <CreditCard size={20} />
                        Payer maintenant
                    </Button>
                </div>
            </aside>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>
        </div>
    );
}

export default function POSPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
                <div className="loader">Chargement du Point de Vente...</div>
            </div>
        }>
            <POSPageContent />
        </Suspense>
    );
}
