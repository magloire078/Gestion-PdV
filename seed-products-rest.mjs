// seed-products-rest.mjs
// Uses the Firestore REST API directly (no gRPC) to seed products.
// Run: node seed-products-rest.mjs

import https from 'https';

const PROJECT_ID = 'studio-2935714752-24641';
const API_KEY = 'AIzaSyBxUyKltELPLjwxsFoVfSIHNEIZtYq0pS0';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const products = [
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

function toFirestoreDoc(data) {
    const fields = {};
    for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'string') fields[key] = { stringValue: val };
        else if (typeof val === 'number') fields[key] = { integerValue: String(val) };
        else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    }
    return { fields };
}

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const parsed = JSON.parse(body);
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                else reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function seed() {
    console.log('🔎 Checking existing products...');
    const existing = await httpsGet(`${BASE_URL}/products?key=${API_KEY}&pageSize=100`);
    const existingNames = new Set(
        (existing.documents || []).map(d => d.fields?.name?.stringValue).filter(Boolean)
    );
    console.log(`   Found ${existingNames.size} existing products.`);

    let added = 0;
    for (const product of products) {
        if (existingNames.has(product.name)) {
            console.log(`   ↩ Skipping (exists): ${product.name}`);
            continue;
        }
        const url = `${BASE_URL}/products?key=${API_KEY}`;
        const doc = toFirestoreDoc(product);
        const result = await httpsPost(url, doc);
        console.log(`   ✅ Added: ${product.name} → ${result.name?.split('/').pop()}`);
        added++;
    }

    if (added === 0) {
        console.log('\n✅ All products already exist. Nothing to add.');
    } else {
        console.log(`\n🎉 Seeding complete! ${added} product(s) added.`);
    }
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
});
