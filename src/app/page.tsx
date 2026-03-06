
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import {
  ChevronRight,
  Store,
  Package,
  BarChart3,
  Layers,
  Zap,
  ShieldCheck,
  Users,
  LayoutDashboard
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      {/* Header avec effet de verre */}
      <header className="fixed top-0 w-full z-50 px-4 lg:px-8 h-20 flex items-center border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-8 mr-8">
          <Link href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Fonctionnalités</Link>
          <Link href="/auth/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Connexion</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:flex text-white/60 hover:text-white hover:bg-white/5" asChild>
            <Link href="/auth/login">Se connecter</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" asChild>
            <Link href="/auth/signup">Essai Gratuit</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Section Héro */}
        <section className="relative overflow-hidden py-10 lg:py-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10 opacity-50" />

          <div className="container px-4 mx-auto">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-4">
              <motion.div
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-foreground/80"
              >
                <Zap className="w-3 h-3 text-primary" />
                <span>Nouveau : Système de Stock Intelligent Intégré</span>
              </motion.div>

              <motion.h1
                {...fadeInUp}
                className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent pb-4"
              >
                Le Point de Vente <br className="hidden md:block" />
                réinventé pour l'élégance.
              </motion.h1>

              <motion.p
                {...fadeInUp}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed"
              >
                Gérez vos ventes, suivez vos stocks et analysez vos performances avec une fluidité inégalée. Une solution complète conçue pour sublimer votre commerce.
              </motion.p>

              <motion.div
                {...fadeInUp}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 rounded-full group" asChild>
                  <Link href="/auth/signup">
                    Démarrer maintenant
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/10 hover:bg-white/5" asChild>
                  <Link href="#features">Voir la démo</Link>
                </Button>
              </motion.div>
            </div>

            {/* Mockup POS Central */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 relative max-w-4xl mx-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl opacity-20" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
                <Image
                  src="/images/pos-hero.png"
                  alt="Interface POS Premium"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid des fonctionnalités */}
        <section id="features" className="py-10 bg-[#0a0a0a]">
          <div className="container px-4 mx-auto">
            <div className="mb-6 text-left max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Une gestion à 360°.</h2>
              <p className="text-white/50 text-lg">Plus qu'un simple tiroir-caisse, un véritable cerveau pour votre entreprise.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
              {/* Vente Rapide */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-3 lg:col-span-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vente Ultra-Rapide</h3>
                <p className="text-white/40 text-sm leading-relaxed">Interface tactile et clavier optimisés pour réduire le temps d'attente en caisse.</p>
                <div className="mt-8 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <ChevronRight className="w-4 h-4 text-black" />
                  </div>
                </div>
              </motion.div>

              {/* Inventaire Visuel */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-3 lg:col-span-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="lg:w-1/2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Inventaire Intelligent</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-4">Suivez vos niveaux de stock en temps réel avec alertes de rupture et gestion multi-catégories.</p>
                    <ul className="space-y-2 text-xs text-white/30">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary" /> Historique complet des mouvements</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary" /> Scan par code-barres</li>
                    </ul>
                  </div>
                  <div className="lg:w-1/2 relative mt-4 lg:mt-0">
                    <Image src="/images/inventory.png" alt="Dashboard Inventaire" width={500} height={350} className="rounded-xl border border-white/10 shadow-lg translate-x-4 lg:translate-x-8" />
                  </div>
                </div>
              </motion.div>

              {/* Analytiques */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-6 lg:col-span-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex flex-col lg:flex-row-reverse gap-8 items-center">
                  <div className="lg:w-1/3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                      <BarChart3 className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Décisions par la Data</h3>
                    <p className="text-white/40 text-sm leading-relaxed">Visualisez vos meilleures ventes et prévoyez votre croissance grâce à nos tableaux de bord avancés.</p>
                  </div>
                  <div className="lg:w-2/3 relative mt-4 lg:mt-0">
                    <Image src="/images/analytics.png" alt="Dashboard Analytiques" width={600} height={400} className="rounded-xl border border-white/10 shadow-lg -translate-x-4 lg:-translate-x-8" />
                  </div>
                </div>
              </motion.div>

              {/* Autres atouts */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-6 lg:col-span-4 p-8 rounded-3xl bg-primary flex flex-col justify-between text-black group cursor-pointer"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-4">Prêt pour demain.</h3>
                  <p className="text-black/60 font-medium">Votre entreprise mérite un système qui évolue avec elle. Cloud-native, sécurisé et rapide.</p>
                </div>
                <div className="flex gap-4 mt-8">
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"><Users className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"><LayoutDashboard className="w-5 h-5" /></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section CTA Final */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -z-10" />
          <div className="container px-4 mx-auto text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 italic">Rejoignez l'élite des commerçants.</h2>
            <p className="text-white/60 text-lg mb-10">Simplifiez votre quotidien et concentrez-vous sur ce qui compte vraiment : vos clients.</p>
            <Button size="lg" className="h-14 px-12 text-xl bg-white text-black hover:bg-white/90 rounded-full transition-transform hover:scale-105" asChild>
              <Link href="/auth/signup">Créer mon compte gratuit</Link>
            </Button>
            <p className="mt-6 text-white/30 text-sm">Aucune carte de crédit requise • Installation en 2 minutes</p>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Logo />
              <p className="text-white/30 text-sm max-w-xs text-center md:text-left">
                La solution ultime pour la gestion moderne de votre point de vente et de vos stocks.
              </p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Produit</span>
                <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Fonctionnalités</Link>
                <Link href="/auth/signup" className="text-sm text-white/60 hover:text-white transition-colors">Tarifications</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Légal</span>
                <div className="flex flex-col gap-2">
                  <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">CGU</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Gestion PME POS. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
