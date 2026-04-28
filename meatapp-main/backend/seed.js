const mongoose = require('mongoose');
const Product = require('./models/Product');
const Config = require('./models/Config');
const { connectToDatabase } = require('./config/db');

const PRODUCTS = [
    // Chicken
    {
        category: 'Chicken', name: 'Morning Fresh Chicken', title: 'Morning Fresh Chicken',
        price: '₹220/kg', originalPrice: '₹250/kg',
        description: 'Freshly cut tender chicken, perfect for daily cooking.',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Curry Cut', 'Boneless', 'Whole'], inStock: true
    },
    {
        category: 'Chicken', name: 'Country Chicken (Nattu Kozhi)', title: 'Country Chicken (Nattu Kozhi)',
        price: '₹350/kg', originalPrice: '₹400/kg',
        description: 'Authentic free-range country chicken with rich flavor.',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Curry Cut', 'Whole'], inStock: true
    },
    {
        category: 'Chicken', name: 'Full Chicken (Whole Bird) 🐔', title: 'Full Chicken (Whole Bird) 🐔',
        price: '₹380/bird', originalPrice: '₹420/bird',
        description: 'One whole fresh chicken, cleaned and dressed. Perfect for roasting, grilling, or festive biryanis.',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Whole', 'Curry Cut'], inStock: true
    },

    // Mutton
    {
        category: 'Mutton', name: 'Premium Tender Mutton', title: 'Premium Tender Mutton',
        price: '₹750/kg', originalPrice: '₹820/kg',
        description: 'Fresh, farm-raised tender mutton cuts suitable for curries and biryani.',
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Curry Cut', 'Biryani Cut', 'Boneless'], inStock: true
    },
    {
        category: 'Mutton', name: 'Mutton Chops', title: 'Mutton Chops',
        price: '₹800/kg', originalPrice: '₹880/kg',
        description: 'Juicy and succulent mutton chops, ideal for frying or grilling.',
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Chop Cut'], inStock: true
    },
    {
        category: 'Mutton', name: 'Mutton Keema (Minced)', title: 'Mutton Keema (Minced)',
        price: '₹780/kg', originalPrice: '₹850/kg',
        description: 'Finely minced fresh mutton, perfect for keema curry and samosas.',
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=400',
        cutOptions: ['Minced'], inStock: true
    },

    // Sub Products (Special Cuts)
    { category: 'SubProduct', name: 'Wings', title: 'Wings', price: '₹200/kg', originalPrice: '₹230/kg', description: 'Fresh chicken wings, great for frying or BBQ.', inStock: true },
    { category: 'SubProduct', name: 'Breast', title: 'Breast', price: '₹240/kg', originalPrice: '₹270/kg', description: 'Boneless chicken breast, lean and healthy.', inStock: true },
    { category: 'SubProduct', name: 'Nalli', title: 'Nalli', price: '₹850/kg', originalPrice: '₹920/kg', description: 'Mutton bone marrow / Nalli — rich and flavorful for soups.', inStock: true },
    { category: 'SubProduct', name: 'Leg', title: 'Leg', price: '₹230/kg', originalPrice: '₹260/kg', description: 'Fresh chicken legs, meaty and tender.', inStock: true },
    { category: 'SubProduct', name: 'Brain', title: 'Brain', price: '₹150/piece', originalPrice: '₹180/piece', description: 'Fresh mutton brain — a delicacy for special dishes.', inStock: true },
    { category: 'SubProduct', name: 'Blood', title: 'Blood', price: '₹50/pack', originalPrice: '₹60/pack', description: 'Fresh mutton blood for poriyal.', inStock: true },
    { category: 'SubProduct', name: 'Kudal', title: 'Kudal', price: '₹300/kg', originalPrice: '₹350/kg', description: 'Mutton Boti / Intestine cut — popular in South Indian cuisine.', inStock: true },
    { category: 'SubProduct', name: 'Thala Kari', title: 'Thala Kari', price: '₹500/head', originalPrice: '₹580/head', description: 'Mutton Head meat — rich in taste and nutrition.', inStock: true },
];

async function seed() {
    try {
        await connectToDatabase();

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Insert all products
        const inserted = await Product.insertMany(PRODUCTS);
        console.log(`✅ Seeded ${inserted.length} products successfully!`);

        // Ensure Config exists with default rates
        let config = await Config.findOne();
        if (!config) {
            config = new Config({
                shopStatus: true,
                chickenRate: '₹220/kg',
                muttonRate: '₹750/kg',
            });
            await config.save();
            console.log('✅ Config created with default rates');
        } else {
            console.log('ℹ️  Config already exists, skipping');
        }

        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
