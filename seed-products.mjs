// seed-products.mjs
// Run with: node seed-products.mjs
// Seeds the Firestore 'products' collection with sample POS products.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    projectId: "studio-2935714752-24641",
    appId: "1:996982313737:web:771dee1603e733470279d8",
    storageBucket: "studio-2935714752-24641.appspot.com",
    apiKey: "AIzaSyBxUyKltELPLjwxsFoVfSIHNEIZtYq0pS0",
    authDomain: "studio-2935714752-24641.firebaseapp.com",
    messagingSenderId: "996982313737"
};

const sampleProducts = [
    { name: "Coca-Cola 50cl", price: 500, category: "Boissons", stock: 100 },
    { name: "Eau minérale 1.5L", price: 300, category: "Boissons", stock: 200 },
    { name: "Fanta Orange 50cl", price: 500, category: "Boissons", stock: 80 },
    { name: "Jus de mangue 33cl", price: 400, category: "Boissons", stock: 60 },
    { name: "Bière Castel 65cl", price: 700, category: "Boissons", stock: 150 },
    { name: "Pain de mie", price: 500, category: "Alimentation", stock: 50 },
    { name: "Boîte de sardines", price: 600, category: "Alimentation", stock: 40 },
    { name: "Riz 1kg", price: 800, category: "Alimentation", stock: 75 },
    { name: "Sucre 1kg", price: 700, category: "Alimentation", stock: 60 },
    { name: "Huile de palme 1L", price: 1200, category: "Alimentation", stock: 45 },
    { name: "Savon Omo 500g", price: 1000, category: "Hygiène", stock: 30 },
    { name: "Shampoing Sunsilk", price: 1500, category: "Hygiène", stock: 25 },
    { name: "Déodorant Rexona", price: 2000, category: "Hygiène", stock: 20 },
    { name: "Allumettes (boîte)", price: 100, category: "Divers", stock: 500 },
    { name: "Bougie x10", price: 500, category: "Divers", stock: 80 },
];

async function seedProducts() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check if products already exist
    const existingSnap = await getDocs(collection(db, 'products'));

    if (!existingSnap.empty) {
        console.log(`✅ ${existingSnap.size} produit(s) déjà dans Firestore. Ajout des produits manquants...`);
        const existingNames = new Set(existingSnap.docs.map(d => d.data().name));
        const toAdd = sampleProducts.filter(p => !existingNames.has(p.name));

        if (toAdd.length === 0) {
            console.log('✅ Tous les produits sont déjà présents. Rien à ajouter.');
            return;
        }

        for (const product of toAdd) {
            await addDoc(collection(db, 'products'), product);
            console.log(`  + Ajouté: ${product.name}`);
        }
        console.log(`✅ ${toAdd.length} produit(s) ajouté(s).`);
        return;
    }

    console.log(`🌱 Seeding ${sampleProducts.length} produits dans Firestore...`);
    for (const product of sampleProducts) {
        const docRef = await addDoc(collection(db, 'products'), product);
        console.log(`  ✅ ${product.name} → ${docRef.id}`);
    }
    console.log(`\n🎉 Seeding terminé ! ${sampleProducts.length} produits ajoutés.`);
}

seedProducts().catch(console.error);
